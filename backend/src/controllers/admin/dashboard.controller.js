const db = require("../../config/db");
const logger = require("../../config/logger");

exports.getDashboardStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required." });
  }

  logger.info(
    `[DASHBOARD] Fetching stats for date range: ${startDate} to ${endDate}`
  );

  const client = await db.connect();

  try {
    const [statsResults, dailyProfitRes, weeklyOrdersRes] = await Promise.all([
      client.query(`
        SELECT
          (SELECT COUNT(*) FROM customers) AS total_customers,
          (SELECT COUNT(*) FROM products) AS total_products,
          (SELECT COUNT(*) FROM sales_orders) AS total_orders,
          (SELECT COUNT(*) FROM sales_orders WHERE status NOT IN ('Delivered', 'Cancelled')) AS pending_orders,
          (SELECT SUM(total_amount) FROM invoices WHERE invoice_status = 'Paid') AS total_revenue,
          (SELECT SUM(total_amount) FROM invoices WHERE invoice_status = 'Paid' AND date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE)) AS monthly_revenue
      `),

      client.query(
        `
        WITH all_dates AS (
          SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS day
        ),
        daily_sales AS (
          SELECT DATE(invoice_date) as day, SUM(total_amount) as revenue
          FROM invoices
          WHERE invoice_date >= $1::date AND invoice_date < ($2::date + '1 day'::interval)
          GROUP BY day
        ),
        daily_costs AS (
          SELECT DATE(po.purchase_date) as day, SUM(poi.purchase_quantity * poi.purchase_price) as cost
          FROM purchase_orders po
          JOIN purchase_order_items poi ON po.purchase_code = poi.purchase_code
          WHERE po.purchase_date >= $1::date AND po.purchase_date < ($2::date + '1 day'::interval)
          GROUP BY day
        )
        SELECT
          TO_CHAR(d.day, 'YYYY-MM-DD') as day,
          COALESCE(s.revenue, 0) as revenue,
          COALESCE(c.cost, 0) as cost,
          (COALESCE(s.revenue, 0) - COALESCE(c.cost, 0)) as profit
        FROM all_dates d
        LEFT JOIN daily_sales s ON d.day = s.day
        LEFT JOIN daily_costs c ON d.day = c.day
        ORDER BY d.day DESC;
      `,
        [startDate, endDate]
      ),

      client.query(`
        SELECT TO_CHAR(order_date, 'Dy') AS day_name, COUNT(*) AS orders
        FROM sales_orders
        WHERE order_date >= date_trunc('week', CURRENT_DATE)
        GROUP BY day_name
      `),
    ]);

    const simpleStats = statsResults.rows[0];

    const dashboardData = {
      totalCustomers: simpleStats.total_customers || "0",
      totalProducts: simpleStats.total_products || "0",
      totalOrders: simpleStats.total_orders || "0",
      pendingOrders: simpleStats.pending_orders || "0",
      totalRevenue: simpleStats.total_revenue || "0",
      monthlyRevenue: simpleStats.monthly_revenue || "0",
      dailyProfit: dailyProfitRes.rows,
      weeklyOrders: weeklyOrdersRes.rows,
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    logger.error(`[DASHBOARD] Error fetching stats: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
