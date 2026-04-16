const db = require("../../config/db");
const logger = require("../../config/logger");

exports.getAllProducts = async (req, res) => {
  logger.info("[PRODUCT] Attempting to fetch all products.");

  try {
    const query = `
      SELECT 
        p.product_id, 
        p.product_code, 
        p.product_name, 
        p.product_category,
        p.product_description,
        p.unit_type,
        p.cost_price,
        p.selling_price,
        p.sell_per_unit_qty, 
        p.selling_unit,
        COALESCE(s.available_quantity, 0) as available_quantity,
        COALESCE(s.saleable_quantity, 0) as saleable_quantity
      FROM 
        products p
      LEFT JOIN 
        stocks s ON p.product_id = s.product_id
      ORDER BY 
        p.product_id DESC;
    `;

    const { rows } = await db.query(query);

    logger.info(
      `[PRODUCT] Successfully fetched ${rows.length} products without image data.`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    logger.error(`[PRODUCT] Error fetching products: ${error.message}`, {
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  const {
    product_name,
    product_category,
    product_description,
    unit_type,
    cost_price,
    selling_price,
    sell_per_unit_qty,
    selling_unit
  } = req.body;
  const imageBuffer = req.file?.buffer;
  if (req.file) {
    const imageMimeType = req.file.mimetype;
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(imageMimeType)) {
      return res
        .status(400)
        .json({ message: "Only JPEG or PNG images are allowed." });
    }

    const MAX_SIZE = 500 * 1024;
    if (imageBuffer.length > MAX_SIZE) {
      return res.status(400).json({ message: "Image size exceeds 500KB." });
    }
  }

  if (!product_name || !product_category || !unit_type || !cost_price) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  logger.info(`[PRODUCT] Attempting to create new product: '${product_name}'.`);

  try {
    const newProductQuery = `
      INSERT INTO products (product_name, product_category, product_description, unit_type, cost_price, product_image, selling_price, sell_per_unit_qty, selling_unit)
      VALUES ($1, $2, $3, $4, $5, $6 ,$7, $8, $9)
      RETURNING *;
    `;

    const { rows } = await db.query(newProductQuery, [
      product_name,
      product_category,
      product_description,
      unit_type,
      cost_price,
      imageBuffer,
      selling_price,
      sell_per_unit_qty,
      selling_unit
    ]);

    const { product_image, ...productData } = rows[0];

    logger.info(
      `[PRODUCT] Successfully created product '${productData.product_name}' with ID: ${productData.product_id}.`
    );

    res.status(201).json(productData);
  } catch (error) {
    logger.error(
      `[PRODUCT] Error creating product '${product_name}': ${error.message}`,
      { stack: error.stack }
    );
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      product_category,
      product_description,
      unit_type,
      cost_price,
      selling_price,
      sell_per_unit_qty,
      selling_unit
    } = req.body;
    const imageBuffer = req.file ? req.file.buffer : null;
    const imageMimeType = req.file ? req.file.mimetype : null;
    logger.info(`[PRODUCT] Attempting update request for product ID: ${id}.`);
    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    if (!product_name || !product_category || !unit_type || !cost_price) {
      logger.warn(
        `[PRODUCT] Update failed for ID ${id}: Missing required fields.`
      );
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (typeof product_name !== "string" || product_name.length > 100) {
      return res.status(400).json({ message: "Invalid product name." });
    }
    if (typeof product_category !== "string" || product_category.length > 50) {
      return res.status(400).json({ message: "Invalid category." });
    }

    if (typeof unit_type !== "string" || unit_type.length > 20) {
      return res.status(400).json({ message: "Invalid unit." });
    }

    if (isNaN(cost_price) || Number(cost_price) <= 0) {
      return res
        .status(400)
        .json({ message: "Cost price must be a positive number." });
    }

    if (isNaN(selling_price) || Number(selling_price) <= 0) {
      return res
        .status(400)
        .json({ message: "Selling price must be a positive number." });
    }

    if (imageBuffer) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(imageMimeType)) {
        return res
          .status(400)
          .json({ message: "Only JPEG or PNG images are allowed." });
      }
      const MAX_SIZE = 500 * 1024;
      if (imageBuffer.length > MAX_SIZE) {
        return res.status(400).json({ message: "Image size exceeds 500KB." });
      }
    }

    logger.info(
      `[PRODUCT] Attempting to update product ID: ${id}. New image provided: ${!!imageBuffer}`
    );

    let updateQuery, queryParams;

    if (imageBuffer) {
      updateQuery = `
        UPDATE products
        SET product_name = $1, product_category = $2, product_description = $3, unit_type = $4, cost_price = $5, selling_price = $6, product_image = $7, updated_at = CURRENT_TIMESTAMP ,sell_per_unit_qty = $8, selling_unit = $9
        WHERE product_id = $10
        RETURNING *;
      `;
      queryParams = [
        product_name,
        product_category,
        product_description || null,
        unit_type,
        cost_price,
        selling_price,
        imageBuffer,
        sell_per_unit_qty, 
        selling_unit,
        productId,
      ];
    } else {
      updateQuery = `
        UPDATE products
        SET product_name = $1, product_category = $2, product_description = $3, unit_type = $4, cost_price = $5, selling_price = $6, updated_at = CURRENT_TIMESTAMP , sell_per_unit_qty = $7, selling_unit = $8
        WHERE product_id = $9
        RETURNING *;
      `;
      queryParams = [
        product_name,
        product_category,
        product_description || null,
        unit_type,
        cost_price,
        selling_price,
        sell_per_unit_qty,
        selling_unit,
        productId,
      ];
    }

    const { rows } = await db.query(updateQuery, queryParams);

    if (rows.length === 0) {
      logger.warn(`[PRODUCT] Update failed: Product with ID ${id} not found.`);
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const { product_image, ...productData } = rows[0];
    logger.info(
      `[PRODUCT] Successfully updated product '${productData.product_name}' (ID: ${id}).`
    );

    res.status(200).json({ success: true, data: productData });
  } catch (error) {
    logger.error(
      `[PRODUCT] Error updating product with ID ${req.params.id}: ${error.message}`,
      { stack: error.stack }
    );
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  logger.info(`[PRODUCT] Attempting to delete product with ID: ${id}.`);
  try {
    const deleteResult = await db.query(
      "DELETE FROM products WHERE product_id = $1",
      [id]
    );

    if (deleteResult.rowCount === 0) {
      logger.warn(`[PRODUCT] Delete failed: Product with ID ${id} not found.`);
      return res.status(404).json({ message: "Product not found" });
    }

    logger.info(`[PRODUCT] Successfully deleted product with ID: ${id}.`);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    logger.error(
      `[PRODUCT] Error deleting product with ID ${id}: ${error.message}`,
      { stack: error.stack }
    );
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;
  logger.info(
    `[PRODUCT] Attempting to fetch full details for product ID: ${id}.`
  );

  try {
    const query = `
      SELECT 
        p.product_id, p.product_code, p.product_name, p.product_category, p.product_description, 
        p.unit_type, p.cost_price, p.selling_price, p.product_image, p.sell_per_unit_qty, p.selling_unit,
        COALESCE(s.available_quantity, 0) as available_quantity
      FROM 
        products p
      LEFT JOIN 
        stocks s ON p.product_id = s.product_id
      WHERE 
        p.product_id = $1;
    `;
    const { rows } = await db.query(query, [id]);

    if (rows.length === 0) {
      logger.warn(
        `[PRODUCT] Full details request failed: Product with ID ${id} not found.`
      );
      return res.status(404).json({ message: "Product not found" });
    }

    const product = rows[0];
    let imageUrl = null;
    if (product.product_image) {
      imageUrl = `data:image/jpeg;base64,${product.product_image.toString(
        "base64"
      )}`;
    }
    const { product_image, ...productData } = product;
    const responsePayload = { ...productData, imageUrl };

    logger.info(
      `[PRODUCT] Successfully fetched full details for product ID: ${id}.`
    );
    res.status(200).json(responsePayload);
  } catch (error) {
    logger.error(
      `[PRODUCT] Error fetching full details for product ID ${id}: ${error.message}`,
      { stack: error.stack }
    );
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
