const db = require("../../config/db");
const logger = require("../../config/logger");
const { convertToBaseUnit } = require('../../utils/customer/unitConverter');

exports.getDailyItemTotals = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "A date parameter is required." });
  }
  logger.info(`[REPORTS] Fetching daily item totals for date: ${date}`);
  try {
    const query = `
      SELECT
        p.product_id,
        p.product_name,
        p.unit_type AS base_unit, -- The unit we want to convert TO
        p.selling_unit,
        p.sell_per_unit_qty,
        SUM(soi.sold_quantity) AS total_units_sold, -- Total count of selling units (e.g., 10 packs)
        COUNT(DISTINCT so.customer_id) AS customer_count
      FROM sales_orders so
      JOIN sales_order_items soi ON so.sales_order_id = soi.sales_order_id
      JOIN products p ON soi.product_id = p.product_id
      WHERE DATE(so.order_date AT TIME ZONE 'Asia/Kolkata') = $1
      GROUP BY p.product_id
      ORDER BY p.product_name;
    `;
    const { rows } = await db.query(query, [date]);

    const processedRows = rows.map(row => {
      const totalInBaseUnit = convertToBaseUnit(
        parseFloat(row.total_units_sold),
        row.selling_unit,                
        parseFloat(row.sell_per_unit_qty),
        row.base_unit                     
      );
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        total_quantity_in_base_unit: totalInBaseUnit,
        base_unit: row.base_unit,
        customer_count: parseInt(row.customer_count, 10),
      };
    });

    res.status(200).json(processedRows);
  } catch (error) {
    logger.error(`[REPORTS] Error fetching daily item totals: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};