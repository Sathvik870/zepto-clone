const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const logger = require("../../config/logger");

const generateUniqueUsername = (email, attempt = 0) => {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  if (attempt === 0) return base;
  return `${base}${Math.floor(Math.random() * 900) + 100}`;
};

exports.signup = async (req, res) => {
  const {
    first_name,
    last_name,
    gender,
    email,
    phone_number,
    password,
    address,
    city,
    state,
    username,
  } = req.body;

  logger.info(`[CUSTOMER_AUTH] Signup attempt for email: ${email}`);

  if (
    !first_name ||
    !last_name ||
    !email ||
    !password ||
    !username ||
    !gender
  ) {
    return res.status(400).json({
      message:
        "First name, last name, username, email, password, and gender are required.",
    });
  }

  try {
    const userExists = await db.query(
      "SELECT 1 FROM customers WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (userExists.rows.length > 0) {
      logger.warn(
        `[CUSTOMER_AUTH] Signup failed: Email or username already exists for ${email}`
      );
      return res.status(409).json({
        message: "A user with this email or username already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserQuery = `
      INSERT INTO customers (first_name, last_name, email, phone_number, password, address, city, state, username, gender, is_google_auth)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
      RETURNING customer_id, customer_code, first_name, email, username, gender;
    `;

    const { rows } = await db.query(newUserQuery, [
      first_name,
      last_name,
      email,
      phone_number,
      hashedPassword,
      address,
      city,
      state,
      username,
      gender,
    ]);

    logger.info(
      `[CUSTOMER_AUTH] Customer successfully created: ${email} with code ${rows[0].customer_code}`
    );

    const newCustomer = rows[0];

    if (newCustomer.is_google_auth === true) {
      logger.warn(
        `[CUSTOMER_AUTH] Login failed: Google account tried password login: ${identifier}`
      );
      return res.status(403).json({
        message:
          "This account uses Google Sign-In. Please log in using Google.",
      });
    } else if (newCustomer.is_guest_user === true) {
      logger.warn(
        `[CUSTOMER_AUTH] Login failed: Guest account tried password login: ${identifier}`
      );
      return res.status(403).json({
        message:
          "This account is a guest account. Please sign up for a full account to log in.",
      });
    }
    const token = jwt.sign(
      {
        customer_id: newCustomer.customer_id,
        customer_code: newCustomer.customer_code,
        role: "customer",
      },
      process.env.CUSTOMER_JWT_SECRET,
      { expiresIn: "365d" }
    );
    res.status(201).json({
      message: "Customer account created successfully!",
      customer: newCustomer,
      token: token,
    });
  } catch (error) {
    logger.error(`[CUSTOMER_AUTH] Signup error for ${email}: ${error.stack}`);
    res.status(500).json({ message: "Internal server error during signup." });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  logger.info(`[CUSTOMER_AUTH] Login attempt for identifier: ${identifier}`);

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Username/Email/Phone and password are required." });
  }

  try {
    const query = `
  SELECT customer_id, customer_code, first_name, last_name, email, phone_number, password, username, gender
  FROM customers
  WHERE (email = $1 
      OR phone_number = $1 
      OR customer_code = $1 
      OR username = $1)
    AND is_google_auth = FALSE;
`;

    const { rows } = await db.query(query, [identifier]);

    if (rows.length === 0) {
      logger.warn(
        `[CUSTOMER_AUTH] Login failed: Customer not found for identifier: ${identifier}`
      );
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const customer = rows[0];

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      logger.warn(
        `[CUSTOMER_AUTH] Login failed: Invalid password for identifier: ${identifier}`
      );
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const tokenPayload = {
      customer_id: customer.customer_id,
      customer_code: customer.customer_code,
      role: "customer",
    };
    const token = jwt.sign(tokenPayload, process.env.CUSTOMER_JWT_SECRET, {
      expiresIn: "365d",
    });

    logger.info(
      `[CUSTOMER_AUTH] Login successful for customer: ${customer.email}`
    );
    res.status(200).json({
      message: "Login successful!",
      token: token,
      customer: {
        customer_id: customer.customer_id,
        customer_code: customer.customer_code,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        username: customer.username,
      },
    });
  } catch (error) {
    logger.error(
      `[CUSTOMER_AUTH] Login error for ${identifier}: ${error.stack}`
    );
    res.status(500).json({ message: "Internal server error during login." });
  }
};

exports.googleAuthSignupOrLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code missing." });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: "v1", auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses",
    });

    const data = profile.data;
    const email = data.emailAddresses?.[0]?.value || null;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Could not retrieve email address from Google." });
    }

    const userInfo = {
      first_name: data.names?.[0]?.givenName || "",
      last_name: data.names?.[0]?.familyName || "",
      email: email,
      gender: data.genders?.[0]?.value || "",
      phone_number: data.phoneNumbers?.[0]?.value || "",
      address: data.addresses?.[0]?.formattedValue || "",
    };

    const existingUserResult = await db.query(
      "SELECT customer_id, customer_code, email, username FROM customers WHERE email = $1",
      [userInfo.email]
    );

    const existingUser = existingUserResult.rows[0];

    let userToReturn;

    if (existingUser) {
      console.log("Customer already exists. Logging in.");
      userToReturn = existingUser;
    } else {
      console.log("New customer detected. Creating account.");

      let attempts = 0;
      let username;
      let isUsernameUnique = false;

      do {
        username = generateUniqueUsername(userInfo.email, attempts++);
        const uniqueCheck = await db.query(
          "SELECT customer_id FROM customers WHERE username = $1",
          [username]
        );
        if (uniqueCheck.rows.length === 0) {
          isUsernameUnique = true;
        }
      } while (!isUsernameUnique && attempts < 5);

      if (!isUsernameUnique) {
        throw new Error("Failed to generate a unique username.");
      }

      const insertQuery = `
            INSERT INTO customers 
            (email, username, first_name, last_name, gender, phone_number, address, is_google_auth)
            VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) 
            RETURNING customer_id, customer_code, email, username
        `;

      const newUserResult = await db.query(insertQuery, [
        userInfo.email,
        username,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.gender,
        userInfo.phone_number,
        userInfo.address,
      ]);

      userToReturn = newUserResult.rows[0];
    }

    const token = jwt.sign(
      {
        customer_id: userToReturn.customer_id,
        customer_code: userToReturn.customer_code,
        role: "customer",
      },
      process.env.CUSTOMER_JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token: token,
      user: userToReturn,
    });
  } catch (error) {
    console.error("Google Signup Error:", error);
    res.status(500).json({ message: "Google signup failed" });
  }
};

exports.googleAuthLoginOnly = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code missing." });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: "v1", auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: "people/me",
      personFields: "names,emailAddresses",
    });

    const data = profile.data;
    const email = data.emailAddresses?.[0]?.value || null;

    if (!email) {
      return res.status(400).json({
        message: "Could not retrieve email address from Google.",
      });
    }

    const userCheckResult = await db.query(
      "SELECT customer_id, customer_code, email, username, is_google_auth FROM customers WHERE email = $1",
      [email]
    );

    const userRecord = userCheckResult.rows[0];

    if (!userRecord) {
      console.log("No existing user found for Google email:", email);
      return res.status(404).json({
        success: false,
        message:
          "No account found with this Google email. Please sign up first.",
      });
    }

    if (userRecord.is_google_auth === false) {
      console.log("Existing non-Google user tried Google login:", email);
      return res.status(403).json({
        success: false,
        message: "Please sign in using your normal login method.",
      });
    }

    const token = jwt.sign(
      {
        customer_id: userRecord.customer_id,
        customer_code: userRecord.customer_code,
        role: "customer",
      },
      process.env.CUSTOMER_JWT_SECRET,
      { expiresIn: "365d" }
    );

    logger.info(
      "[Google Login]Existing Google user logged in:",
      userRecord.customer_code
    );

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: userRecord,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Google login failed" });
  }
};

exports.guestLogin = async (req, res) => {
  const { phone_number } = req.body;
  logger.info(`[GUEST_AUTH] Guest login attempt for phone: ${phone_number}`);

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    const { rows } = await db.query(
      "SELECT customer_id, customer_code, first_name, is_guest_user, is_google_auth FROM customers WHERE phone_number = $1",
      [phone_number]
    );

    let customer;

    if (rows.length > 0) {
      const existingUser = rows[0];

      if (existingUser.is_guest_user) {
        logger.info(
          `[GUEST_AUTH] Existing guest user found for phone: ${phone_number}`
        );
        customer = existingUser;
      } else {
        logger.warn(
          `[GUEST_AUTH] Phone number ${phone_number} belongs to a registered user. Guest login denied.`
        );
        return res.status(409).json({
          message:
            "This phone number is already registered. Please log in using your password or Google account.",
          isRegisteredUser: true,
        });
      }
    } else {
      logger.info(
        `[GUEST_AUTH] No user found. Creating new guest account for phone: ${phone_number}`
      );

      const newGuestQuery = `
        INSERT INTO customers (phone_number, first_name, last_name, email, is_guest_user)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING customer_id, customer_code, first_name, is_guest_user;
      `;

      const dummyEmail = `guest_${Date.now()}@farmerlogistics.com`;

      const newGuestResult = await db.query(newGuestQuery, [
        phone_number,
        "Guest",
        "User",
        dummyEmail,
      ]);

      customer = newGuestResult.rows[0];
    }

    const tokenPayload = {
      customer_id: customer.customer_id,
      customer_code: customer.customer_code,
      role: "customer",
      is_guest: true,
    };

    const token = jwt.sign(tokenPayload, process.env.CUSTOMER_JWT_SECRET, {
      expiresIn: "365d",
    });

    res.status(200).json({
      message: "Guest login successful!",
      token: token,
      customer: customer,
    });
  } catch (error) {
    logger.error(
      `[GUEST_AUTH] Error during guest login for ${phone_number}: ${error.message}`
    );
    if (error.code === "23505") {
      return res
        .status(500)
        .json({ message: "An unexpected error occurred. Please try again." });
    }
    res.status(500).json({ message: "Internal server error." });
  }
};
