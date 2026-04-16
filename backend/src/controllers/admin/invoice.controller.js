const db = require("../../config/db");
const logger = require("../../config/logger");

exports.getAllInvoices = async (req, res) => {
  logger.info("[ADMIN_INVOICE] Fetching all invoices.");
  try {
    const query = `
      SELECT 
        i.invoice_id,
        i.invoice_code,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.amount_paid,
        i.invoice_status,
        so.payment_method,
        c.phone_number,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.customer_id
      JOIN sales_orders so ON i.sales_order_id = so.sales_order_id
      ORDER BY i.invoice_date DESC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    logger.error(`[ADMIN_INVOICE] Error fetching invoices: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateInvoicePayment = async (req, res) => {
  const { id } = req.params;
  const { amount_paid_now } = req.body;

  if (amount_paid_now === undefined || isNaN(parseFloat(amount_paid_now))) {
    return res
      .status(400)
      .json({ message: "A valid payment amount is required." });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM invoices WHERE invoice_id = $1 FOR UPDATE",
      [id]
    );
    if (rows.length === 0) throw new Error("Invoice not found.");
    const currentInvoice = rows[0];
    if (currentInvoice.invoice_status === "Paid") {
      throw new Error("This invoice has already been fully paid.");
    }

    const newAmountPaid =
      parseFloat(currentInvoice.amount_paid) + parseFloat(amount_paid_now);

    let newInvoiceStatus;
    if (newAmountPaid >= parseFloat(currentInvoice.total_amount)) {
      newInvoiceStatus = "Paid";
    } else {
      newInvoiceStatus = "Partially Paid";
    }

    await client.query(
      "UPDATE invoices SET amount_paid = $1, invoice_status = $2 WHERE invoice_id = $3",
      [newAmountPaid, newInvoiceStatus, id]
    );

    const newPaymentStatus =
      newInvoiceStatus === "Paid" ? "Paid" : "Partially Paid";
    await client.query(
      "UPDATE sales_orders SET payment_status = $1, payment_date = CURRENT_DATE WHERE sales_order_id = $2",
      [newPaymentStatus, currentInvoice.sales_order_id]
    );

    await client.query("COMMIT");
    res
      .status(200)
      .json({
        message: "Payment updated successfully",
        invoice_status: newInvoiceStatus,
      });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`[ADMIN_PAYMENT] Error: ${error.message}`);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};
