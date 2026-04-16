const db = require("../../config/db");
const logger = require("../../config/logger");

exports.getSaleableProducts = async (req, res) => {
  const { category, search } = req.query;

  logger.info(
    `[PUBLIC_PRODUCT] Fetching products. Category: ${
      category || "All"
    }, Search: '${search || ""}'`
  );

  try {
    let query = `
      SELECT 
        p.product_id, p.product_code, p.product_name, p.product_category,
        p.product_description, p.unit_type, p.cost_price, p.selling_price,
        p.sell_per_unit_qty, p.selling_unit, p.product_image,
        -- Use COALESCE to ensure we always get a number, even if no stock record exists
        COALESCE(s.saleable_quantity, 0) as saleable_quantity 
      FROM 
        products p
      LEFT JOIN -- Use LEFT JOIN to include products that might not have a stock entry yet
        stocks s ON p.product_id = s.product_id
    `;

    const queryParams = [];
    let paramIndex = 1;

    query += ` WHERE 1=1`;

    if (category && category.toLowerCase() !== "all") {
      query += ` AND p.product_category = $${paramIndex++}`;
      queryParams.push(category);
    }

    if (search) {
      query += ` AND p.product_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${search}%`);
    }

    query += `
  ORDER BY 
    (COALESCE(s.saleable_quantity, 0) = 0) ASC,
    p.product_name ASC;
`;

    const { rows } = await db.query(query, queryParams);

    const productsWithImages = rows.map((product) => {
      let imageUrl = null;
      if (product.product_image) {
        imageUrl = `data:image/jpeg;base64,${product.product_image.toString(
          "base64"
        )}`;
      }
      const { product_image, ...productData } = product;
      return { ...productData, imageUrl };
    });

    res.status(200).json(productsWithImages);
  } catch (error) {
    logger.error(
      `[PUBLIC_PRODUCT] Error fetching saleable products: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
