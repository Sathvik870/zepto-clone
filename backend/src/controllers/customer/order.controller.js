const db = require("../../config/db");
const logger = require("../../config/logger");
const { convertToBaseUnit } = require("../../utils/customer/unitConverter");
const { createInvoicePDF } = require("../../utils/common/invoiceGenerator");
const numberToWords = require("number-to-words");
const { format } = require("date-fns");
const { sendPushToAdmins } = require("../../utils/common/pushService");

exports.placeOrder = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const { cartItems, customer_details, paymentMethod } = req.body;
  const deliveryCharges = req.body.customer_details.delivery_charges || 0;

  if( paymentMethod !== "COD" && paymentMethod !== "UPI" ) {
    return res.status(400).json({ message: "Invalid payment method." });
  }
  
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  const client = await db.connect();
  logger.info(
    `[ORDER] Starting order placement for customer ID: ${customer_id}`
  );

  try {
    await client.query("BEGIN");

    const orderQuery = `
      INSERT INTO sales_orders (customer_id, payment_method, status)
      VALUES ($1, $2, 'Confirmed')
      RETURNING sales_order_id, order_date;
    `;

    const orderResult = await client.query(orderQuery, [
      customer_id,
      paymentMethod,
    ]);

    const newOrder = orderResult.rows[0];
    const { sales_order_id } = newOrder;

    logger.info(`[ORDER] Created sales_order with ID: ${sales_order_id}`);

    let subtotal = 0;

    for (const item of cartItems) {
      const productQuery =
        "SELECT unit_type FROM products WHERE product_id = $1";
      const productResult = await client.query(productQuery, [item.product_id]);
      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.product_id} not found.`);
      }
      const baseUnit = productResult.rows[0].unit_type;

      const price = parseFloat(item.selling_price);
      const quantity = parseFloat(item.quantity);
      if (isNaN(price) || isNaN(quantity))
        throw new Error(`Invalid price/quantity for ${item.product_name}`);
      subtotal += quantity * price;

      const deductionAmount = convertToBaseUnit(
        item.quantity,
        item.selling_unit,
        item.sell_per_unit_qty,
        baseUnit
      );

      const orderItemQuery = `
        INSERT INTO sales_order_items (sales_order_id, product_id, sold_quantity, sold_price)
        VALUES ($1, $2, $3, $4);
      `;
      await client.query(orderItemQuery, [
        sales_order_id,
        item.product_id,
        item.quantity,
        item.selling_price,
      ]);
      const stockUpdateQuery = `
        UPDATE stocks
        SET 
          saleable_quantity = saleable_quantity - $1,
          last_updated = CURRENT_TIMESTAMP
        WHERE 
          product_id = $2 AND saleable_quantity >= $1;
      `;
      const stockUpdateResult = await client.query(stockUpdateQuery, [
        deductionAmount,
        item.product_id,
      ]);

      if (stockUpdateResult.rowCount === 0) {
        logger.error(
          `[ORDER] Insufficient stock for product ID: ${item.product_id}. Rolling back transaction.`
        );
        throw new Error(`Insufficient stock for product: ${item.product_name}`);
      }
      logger.info(
        `[ORDER] Deducted ${deductionAmount} ${baseUnit} for product ${item.product_name}`
      );
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const totalAmount = subtotal + deliveryCharges;

    const initialInvoiceStatus = paymentMethod === "COD" ? "Upcoming" : "Paid";
    const initialAmountPaid = paymentMethod === "COD" ? 0 : totalAmount;
    logger.info(
      `[INVOICE] Creating invoice record for sales_order ID: ${sales_order_id}`
    );

    const invoiceInsertQuery = `
      INSERT INTO invoices (sales_order_id, customer_id, subtotal, delivery_charges, total_amount, shipping_address, due_date, invoice_status, amount_paid)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE + INTERVAL '5 days', $7, $8)
      RETURNING invoice_id, invoice_code, invoice_date;
    `;

    const invoiceResult = await client.query(invoiceInsertQuery, [
      sales_order_id,
      customer_id,
      subtotal,
      deliveryCharges,
      totalAmount,
      customer_details.address,
      initialInvoiceStatus,
      initialAmountPaid,
    ]);

    const newInvoice = invoiceResult.rows[0];
    logger.info(
      `[INVOICE] Successfully created invoice with code: ${newInvoice.invoice_code}`
    );

    await client.query("COMMIT");
    logger.info(
      `[ORDER] Order ${sales_order_id} successfully placed and committed.`
    );

    const totalInWords = numberToWords.toWords(totalAmount);
    const capitalizedTotalInWords =
      totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1);

    const invoiceData = {
      order: {
        ...newOrder,
        sales_order_code: newInvoice.invoice_code,
        order_date: newInvoice.invoice_date,
      },
      customer: customer_details,
      items: cartItems.map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity),
        selling_price: parseFloat(item.selling_price),
      })),
      subtotal: subtotal,
      deliveryCharges: deliveryCharges,
      total: totalAmount,
      totalInWords: capitalizedTotalInWords,
    };

    logger.info(
      `[PDF] Generating invoice PDF for invoice code: ${newInvoice.invoice_code}`
    );

    logger.info(`[PDF] Successfully generated PDF buffer.`);

    const pushPayload = {
      title: "New Order Received!",
      body: `Order number ${newInvoice.invoice_code} from ${customer_details.first_name}`,
      url: "/admin/sales-orders",
    };
    sendPushToAdmins(pushPayload);
    const newOrderPayload = {
      sales_order_id,
      invoice_code: newInvoice.invoice_code,
      customer_id,
      customer_name: `${customer_details.first_name} ${customer_details.last_name}`,
      phone_number: customer_details.phone_number,
      total_amount: totalAmount,
      delivery_status: "Confirmed",
      payment_status: paymentMethod === "COD" ? "Unpaid" : "Paid",
      payment_method: paymentMethod,
      order_date: new Date().toISOString(),
      shipping_address: customer_details.address,

      order_items: cartItems.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_type: item.unit_type,
        selling_unit: item.selling_unit,
        sell_per_unit_qty: item.sell_per_unit_qty,
        price: item.selling_price,
      })),
    };

    req.io.emit("new_order", newOrderPayload);
    logger.info(
      `[SOCKET] Emitted 'new_order' event for order ID: ${sales_order_id}`
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${newInvoice.invoice_code}.pdf`
    );
    createInvoicePDF(invoiceData, res);
  } catch (error) {
    console.error("Error placing order:", error);
    await client.query("ROLLBACK");
    logger.error(
      `[ORDER] Error during order placement: ${error.message}. Transaction rolled back.`
    );
    return res
      .status(400)
      .json({ message: error.message || "Failed to place order." });
  } finally {
    client.release();
  }
};

exports.getOrderSummary = async (req, res) => {
  const customer_id = req.customer.customer_id;
  logger.info(`[ORDER] Fetching order summary for customer ID: ${customer_id}`);

  try {
    const query = `
      SELECT
        DATE(order_date AT TIME ZONE 'Asia/Kolkata') as order_day,
        BOOL_AND(payment_status = 'Paid') as all_paid,
        BOOL_OR(payment_status = 'Paid') as some_paid
      FROM
        sales_orders
      WHERE
        customer_id = $1
      GROUP BY
        order_day
      ORDER BY
        order_day;
    `;
    const { rows } = await db.query(query, [customer_id]);
    const dateStatus = {};
    rows.forEach((row) => {
      const dateStr = format(new Date(row.order_day), "yyyy-MM-dd");

      if (row.all_paid) {
        dateStatus[dateStr] = "paid";
      } else if (row.some_paid) {
        dateStatus[dateStr] = "partial";
      } else {
        dateStatus[dateStr] = "unpaid";
      }
    });

    res.status(200).json(dateStatus);
  } catch (error) {
    console.error("Error fetching order summary:", error);
    logger.error(`[ORDER] Error fetching order summary: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch order summary." });
  }
};

exports.getInvoicesForDate = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const { date } = req.params;
  logger.info(
    `[ORDER] Fetching invoices for customer ID ${customer_id} on date: ${date}`
  );

  try {
    const query = `
            SELECT 
              i.invoice_id, 
              i.invoice_code, 
              i.total_amount, 
              i.invoice_date,
              so.sales_order_id,
              so.status
            FROM invoices i
            JOIN sales_orders so ON i.sales_order_id = so.sales_order_id
            WHERE i.customer_id = $1 AND DATE(i.invoice_date) = $2
            ORDER BY i.invoice_date DESC;
        `;
    const { rows } = await db.query(query, [customer_id, date]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching invoices for date:", error);
    logger.error(`[ORDER] Error fetching invoices for date: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to fetch invoices for the specified date." });
  }
};

exports.getInvoicePDF = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const { invoiceCode } = req.params;

  logger.info(
    `[PDF_DOWNLOAD] Customer ID ${customer_id} requested PDF for invoice code: ${invoiceCode}`
  );

  const client = await db.connect();

  try {
    const query = `
      SELECT
        i.invoice_id, 
        i.invoice_code, 
        i.invoice_date, 
        i.subtotal, 
        i.delivery_charges, 
        i.total_amount,
        so.sales_order_id, 
        so.order_date, 
        so.status,
        c.first_name, 
        c.last_name, 
        c.email, 
        c.phone_number, 
        c.address, 
        c.city, 
        c.state,
        p.product_name, 
        p.sell_per_unit_qty, 
        p.selling_unit,
        soi.sold_quantity, 
        soi.sold_price
      FROM invoices i
      JOIN sales_orders so ON i.sales_order_id = so.sales_order_id
      JOIN customers c ON i.customer_id = c.customer_id
      JOIN sales_order_items soi ON so.sales_order_id = soi.sales_order_id
      JOIN products p ON soi.product_id = p.product_id
      WHERE 
        i.invoice_code = $1 AND i.customer_id = $2;
    `;

    const { rows } = await client.query(query, [invoiceCode, customer_id]);

    if (rows.length === 0) {
      logger.warn(
        `[PDF_DOWNLOAD] Invoice not found or access denied for invoice ${invoiceCode}, customer ${customer_id}`
      );
      return res.status(404).json({
        message: "Invoice not found or you do not have permission to view it.",
      });
    }

    const firstRow = rows[0];

    const invoiceData = {
      order: {
        sales_order_id: firstRow.sales_order_id,
        sales_order_code: firstRow.invoice_code,
        order_date: firstRow.invoice_date,
        status: firstRow.status,
      },
      customer: {
        first_name: firstRow.first_name,
        last_name: firstRow.last_name,
        address: firstRow.address,
        city: firstRow.city,
        state: firstRow.state,
      },
      subtotal: parseFloat(firstRow.subtotal),
      deliveryCharges: parseFloat(firstRow.delivery_charges),
      total: parseFloat(firstRow.total_amount),
      totalInWords: numberToWords
        .toWords(parseFloat(firstRow.total_amount))
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      items: rows.map((row) => ({
        product_name: row.product_name,
        sell_per_unit_qty: row.sell_per_unit_qty,
        selling_unit: row.selling_unit,
        quantity: parseFloat(row.sold_quantity),
        selling_price: parseFloat(row.sold_price),
      })),
    };

    logger.info(`[PDF_DOWNLOAD] Generating PDF for invoice ${invoiceCode}`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${invoiceCode}.pdf`
    );

    createInvoicePDF(invoiceData, res);
  } catch (error) {
    logger.error(
      `[PDF_DOWNLOAD] Error generating PDF for invoice ${invoiceCode}: ${error.message}`
    );
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  } finally {
    client.release();
  }
};

exports.cancelOrder = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const { orderId } = req.params;

  const client = await db.connect();
  logger.info(
    `[ORDER_CANCEL] Customer ${customer_id} cancelling order ${orderId}`
  );

  try {
    await client.query("BEGIN");
    const checkQuery = `
      SELECT sales_order_id, status FROM sales_orders 
      WHERE sales_order_id = $1 AND customer_id = $2
      FOR UPDATE;
    `;
    const { rows } = await client.query(checkQuery, [orderId, customer_id]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found." });
    }

    const order = rows[0];
    const allowedStatuses = ["Confirmed", "Packing"];

    if (!allowedStatuses.includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `Order cannot be cancelled. Current status is ${order.status}.`,
      });
    }

    const updateOrderQuery = `
      UPDATE sales_orders SET status = 'Cancelled' WHERE sales_order_id = $1 RETURNING *;
    `;
    const updatedOrderResult = await client.query(updateOrderQuery, [orderId]);
    const updatedOrder = updatedOrderResult.rows[0];

    const itemsQuery = `
      SELECT p.product_id, soi.sold_quantity, p.unit_type, p.selling_unit, p.sell_per_unit_qty, p.product_name
      FROM sales_order_items soi
      JOIN products p ON soi.product_id = p.product_id
      WHERE soi.sales_order_id = $1;
    `;
    const { rows: items } = await client.query(itemsQuery, [orderId]);

    for (const item of items) {
      const amountToRestore = convertToBaseUnit(
        parseFloat(item.sold_quantity),
        item.selling_unit,
        parseFloat(item.sell_per_unit_qty),
        item.unit_type
      );

      logger.info(
        `[ORDER_CANCEL] Restoring ${amountToRestore} ${item.unit_type} for ${item.product_name}`
      );

      await client.query(
        `
        UPDATE stocks 
        SET saleable_quantity = saleable_quantity + $1, last_updated = CURRENT_TIMESTAMP 
        WHERE product_id = $2
      `,
        [amountToRestore, item.product_id]
      );
    }

    await client.query("COMMIT");
    req.io.emit("order_status_updated", {
      orderId: orderId,
      customerId: customer_id,
      status: "Cancelled",
    });

    res.status(200).json({ message: "Order cancelled successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`[ORDER_CANCEL] Error: ${error.message}`);
    res.status(500).json({ message: "Failed to cancel order." });
  } finally {
    client.release();
  }
};
