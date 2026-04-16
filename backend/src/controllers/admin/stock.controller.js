const db = require("../../config/db");
const logger = require("../../config/logger");

exports.batchUpdateStock = async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid payload: 'updates' array is required." });
  }

  logger.info(`[STOCK] Attempting to batch update ${updates.length} products.`);

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    for (const update of updates) {
      const { product_id, saleable_quantity, available_quantity } = update;
      if (
        product_id === undefined ||
        saleable_quantity === undefined ||
        available_quantity === undefined
      ) {
        throw new Error(
          `Invalid update object for product_id ${product_id || "unknown"}.`
        );
      }

      const originalStockResult = await client.query(
        "SELECT available_quantity, saleable_quantity FROM stocks WHERE product_id = $1",
        [product_id]
      );

      if (originalStockResult.rows.length === 0) {
        throw new Error(`Product with ID ${product_id} not found in stocks.`);
      }

      const originalStock = originalStockResult.rows[0];
      const totalStock =
        Number(originalStock.available_quantity) +
        Number(originalStock.saleable_quantity);

      const newTotal = Number(saleable_quantity) + Number(available_quantity);
      if (Math.abs(newTotal - totalStock) > 0.01) {
        throw new Error(
          `Invalid stock reallocation for product ID ${product_id}. Total must remain ${totalStock}.`
        );
      }

      const updateQuery = `
        UPDATE stocks
        SET 
          available_quantity = $1,
          saleable_quantity = $2,
          last_updated = CURRENT_TIMESTAMP
        WHERE
          product_id = $3;
      `;
      await client.query(updateQuery, [
        available_quantity,
        saleable_quantity,
        product_id,
      ]);
    }

    await client.query("COMMIT");
    logger.info(
      `[STOCK] Successfully batch updated ${updates.length} products.`
    );
    res.status(200).json({ message: "Stock levels updated successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(
      `[STOCK] Batch update failed and was rolled back: ${error.message}`
    );
    console.error(error);
    res
      .status(409)
      .json({
        message:
          error.message || "An error occurred during the update process.",
      });
  } finally {
    client.release();
  }
};
