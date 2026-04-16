const db = require("../../config/db");
const logger = require("../../config/logger");
const { convertToBaseUnit } = require("../../utils/customer/unitConverter");
const { sendPushToCustomer } = require("../../utils/common/pushService");

exports.getAllSalesOrders = async (req, res) => {
  logger.info("[ADMIN_SALES] Fetching all sales orders.");
  try {
    const query = `
      SELECT 
        so.sales_order_id,
        so.order_date,
        so.status as delivery_status,
        so.payment_status,
        so.payment_method,
        c.customer_id,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.phone_number,
        i.shipping_address,
        i.total_amount,
        i.invoice_code,
        COALESCE(
          json_agg(
            json_build_object(
              'product_name', p.product_name,
              'quantity', soi.sold_quantity,
              'unit_type', p.unit_type,     
              'selling_unit', p.selling_unit, 
              'sell_per_unit_qty', p.sell_per_unit_qty, 
              'price', soi.sold_price
            )
          ) FILTER (WHERE soi.item_id IS NOT NULL), '[]'
        ) as order_items
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.customer_id
      LEFT JOIN invoices i ON so.sales_order_id = i.sales_order_id
      LEFT JOIN sales_order_items soi ON so.sales_order_id = soi.sales_order_id
      LEFT JOIN products p ON soi.product_id = p.product_id
      GROUP BY so.sales_order_id, c.customer_id, i.invoice_id
      ORDER BY so.order_date DESC;
    `;

    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    logger.error(`[ADMIN_SALES] Error fetching orders: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  logger.info(`[ADMIN_SALES] Updating order ${id} status to: ${status}`);

  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }

  const allowedStatuses = [
    "Confirmed",
    "Packing",
    "In Transit",
    "Delivered",
    "Cancelled",
  ];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const checkResult = await client.query(
      "SELECT * FROM sales_orders WHERE sales_order_id = $1 FOR UPDATE",
      [id]
    );
    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found." });
    }

    const currentOrder = checkResult.rows[0];

    if (
      currentOrder.status === "Cancelled" ||
      currentOrder.status === "Delivered"
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Cannot change status of an order that is already ${currentOrder.status}.`,
      });
    }
    if (status === "Cancelled") {
      logger.info(
        `[ADMIN_CANCEL] Status is 'Cancelled'. Restoring stock for order ${id}.`
      );
      const itemsQuery = `
        SELECT p.product_id, soi.sold_quantity, p.unit_type, p.selling_unit, p.sell_per_unit_qty, p.product_name
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.product_id
        WHERE soi.sales_order_id = $1;
      `;
      const { rows: items } = await client.query(itemsQuery, [id]);

      for (const item of items) {
        const amountToRestore = convertToBaseUnit(
          parseFloat(item.sold_quantity),
          item.selling_unit,
          parseFloat(item.sell_per_unit_qty),
          item.unit_type
        );
        await client.query(
          `
          UPDATE stocks SET saleable_quantity = saleable_quantity + $1 WHERE product_id = $2
        `,
          [amountToRestore, item.product_id]
        );
        logger.info(
          `[ADMIN_CANCEL] Restored ${amountToRestore} ${item.unit_type} for ${item.product_name}`
        );
      }
    }
    const updateQuery = `UPDATE sales_orders SET status = $1 WHERE sales_order_id = $2 RETURNING *;`;
    const { rows } = await client.query(updateQuery, [status, id]);
    const updatedOrder = rows[0];

    await client.query("COMMIT");
    const pushPayload = {
      title: `Your Order number ${updatedOrder.sales_order_id} Updated`,
      body: `Your order status is now: ${updatedOrder.status}`,
      url: "/orders",
    };
    sendPushToCustomer(updatedOrder.customer_id, pushPayload);
    req.io.emit("order_status_updated", {
      customerId: updatedOrder.customer_id,
      orderId: updatedOrder.sales_order_id,
      status: updatedOrder.status,
    });
    logger.info(`[SOCKET] Emitted status update for Order #${id}`);

    res
      .status(200)
      .json({ message: "Status updated successfully", order: updatedOrder });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      `[ADMIN_SALES] Error updating status for order ${id}: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  logger.info(
    `[ADMIN_SALES] Updating payment status for order ${id} to: ${payment_status}`
  );

  if (!payment_status) {
    return res.status(400).json({ message: "Payment status is required." });
  }

  try {
    const checkResult = await db.query(
      "SELECT payment_status, payment_method FROM sales_orders WHERE sales_order_id = $1",
      [id]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }
    const currentOrder = checkResult.rows[0];
    if (currentOrder.payment_status === "Paid") {
      return res
        .status(400)
        .json({ message: "This order has already been marked as paid." });
    }
    const query = `UPDATE sales_orders SET payment_status = $1 WHERE sales_order_id = $2 RETURNING *;`;
    const { rows } = await db.query(query, [payment_status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Payment status updated", order: rows[0] });
  } catch (error) {
    logger.error(
      `[ADMIN_SALES] Error updating payment status for order ${id}: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
