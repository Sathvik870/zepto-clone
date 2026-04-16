const db = require("../../config/db");
const logger = require("../../config/logger");

exports.getCustomerProfile = async (req, res) => {
  const customer_id = req.customer.customer_id;

  logger.info(
    `[CUSTOMER] Attempting to fetch profile for customer ID: ${customer_id}`
  );

  try {
    const query = `
        SELECT 
            customer_id,
            customer_code,
            username,
            gender,
            first_name,
            last_name,
            email,
            phone_number,
            latitude,
            longitude,
            address,
            city,
            state,
            landmark 
        FROM customers 
        WHERE customer_id = $1
    `;

    const { rows } = await db.query(query, [customer_id]);

    if (rows.length === 0) {
      logger.warn(
        `[CUSTOMER] Profile not found for customer ID: ${customer_id} despite valid token.`
      );
      return res.status(404).json({ message: "Customer profile not found." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error fetching profile for customer ID ${customer_id}: ${error.message}`
    );
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCustomerLocation = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const { address, city, state, lat, lng } = req.body;

  logger.info(
    `[CUSTOMER] Attempting to update location for customer ID: ${customer_id}`
  );

  if (!address) {
    return res.status(400).json({ message: "Address field is required." });
  }

  try {
    const updateQuery = `
      UPDATE customers
      SET 
        address = $1,
        city = $2,
        state = $3,
        latitude = $4, 
        longitude = $5
      WHERE 
        customer_id = $6 -- The customer_id should be the 6th parameter
      RETURNING customer_id, address, city, state, latitude, longitude;
    `;

    const { rows } = await db.query(updateQuery, [
      address || null,
      city || null,
      state || null,
      lat,
      lng,
      customer_id,
    ]);

    if (rows.length === 0) {
      logger.warn(
        `[CUSTOMER] Update location failed: Customer ID ${customer_id} not found.`
      );
      return res.status(404).json({ message: "Customer not found." });
    }

    logger.info(
      `[CUSTOMER] Successfully updated location for customer ID: ${customer_id}`
    );
    res.status(200).json({
      message: "Location updated successfully!",
      location: rows[0],
    });
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error updating location for customer ID ${customer_id}: ${error.message}`
    );
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCustomerProfile = async (req, res) => {
  const customer_id = req.customer.customer_id;
  const {
    first_name,
    last_name,
    gender,
    username,
    email,
    phone_number,
    address,
    city,
    state,
    landmark,
  } = req.body;

  logger.info(
    `[CUSTOMER] Profile update attempt for customer ID: ${customer_id}`
  );

  if (!first_name || !last_name || !email) {
    return res
      .status(400)
      .json({ message: "First name, last name, and email are required." });
  }

  try {
    const conflictCheck = await db.query(
      "SELECT customer_id FROM customers WHERE (username = $1 OR email = $2) AND customer_id != $3",
      [username, email, customer_id]
    );
    if (conflictCheck.rows.length > 0) {
      return res
        .status(409)
        .json({
          message: "Username or email is already in use by another account.",
        });
    }

    const updateQuery = `
      UPDATE customers
      SET
        first_name = $1, last_name = $2, gender = $3, username = $4,
        email = $5, phone_number = $6, address = $7, city = $8, state = $9, landmark = $10
      WHERE
        customer_id = $11
      RETURNING customer_id, first_name, last_name, email, phone_number, username, gender, address, city, state, landmark;
    `;
    const { rows } = await db.query(updateQuery, [
      first_name,
      last_name,
      gender,
      username,
      email,
      phone_number,
      address,
      city,
      state,
      landmark,
      customer_id,
    ]);

    logger.info(
      `[CUSTOMER] Successfully updated profile for customer ID: ${customer_id}`
    );
    res
      .status(200)
      .json({ message: "Profile updated successfully!", customer: rows[0] });
  } catch (error) {
    logger.error(
      `[CUSTOMER] Error updating profile for customer ID ${customer_id}: ${error.message}`
    );
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.checkUsername = async (req, res) => {
  const { username } = req.body;
  const customer_id = req.customer.customer_id;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const { rows } = await db.query(
      "SELECT 1 FROM customers WHERE username = $1 AND customer_id != $2",
      [username, customer_id]
    );

    if (rows.length > 0) {
      res.status(200).json({ available: false });
    } else {
      res.status(200).json({ available: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};
