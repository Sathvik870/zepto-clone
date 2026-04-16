const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../../config/logger");

exports.signup = async (req, res) => {
  logger.info(`[AUTH] Signup attempt for ${req.body.username || "unknown"}.`);
  let { first_name, last_name, username, password, email, phone_number, role } =
    req.body;

  if (
    !first_name ||
    !last_name ||
    !username ||
    !password ||
    !email ||
    !phone_number ||
    !role
  ) {
    logger.warn(`[AUTH] Signup failed: Missing required fields.`);
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }

  if (
    !/^[A-Za-z\s'-]{2,50}$/.test(first_name) ||
    !/^[A-Za-z\s'-]{2,50}$/.test(last_name)
  ) {
    return res.status(400).json({ message: "Invalid name format." });
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({ message: "Invalid username format." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }
  if (!/^\+?[0-9]{10,15}$/.test(phone_number)) {
    return res.status(400).json({ message: "Invalid phone number format." });
  }

  const sanitizeInput = (input) => String(input).trim();

  first_name = sanitizeInput(first_name);
  last_name = sanitizeInput(last_name);
  username = sanitizeInput(username);
  email = sanitizeInput(email);
  phone_number = sanitizeInput(phone_number);

  role = role.toLowerCase();

  if (role !== "admin" && role !== "superadmin") {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  try {
    logger.info(`[AUTH] Checking for existing user: ${username}`);
    const userExists = await db.query(
      "SELECT 1 FROM users WHERE username = $1 OR email = $2 LIMIT 1",
      [username, email]
    );
    if (userExists.rows.length > 0) {
      logger.warn(
        `[AUTH] Signup failed: Username or email already exists for ${username}`
      );
      return res
        .status(409)
        .json({ message: "Username or email already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    logger.info(`[AUTH] Creating new user: ${username}`);
    const newUserQuery = `
      INSERT INTO users (first_name, last_name,username, password, email, phone_number, role) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING  user_id, first_name, last_name, username, email, role, created_at, authorized;
    `;
    const { rows } = await db.query(newUserQuery, [
      first_name,
      last_name,
      username,
      hashedPassword,
      email,
      phone_number,
      role,
    ]);

    logger.info(
      `[AUTH] User successfully created: ${username}. Awaiting admin authorization.`
    );
    res.status(201).json({
      message:
        "User registered successfully. Your account requires admin authorization before you can log in.",
      user: rows[0],
    });
  } catch (error) {
    logger.error(
      `[AUTH] Signup error for ${username || "unknown"}: ${error.stack}`
    );
    if (error.code === "23505") {
      logger.warn(`[AUTH] Duplicate entry detected: ${error.detail}`);
      return res.status(409).json({
        message:
          "Duplicate entry detected. Please use a different username or email already taken",
      });
    }
    res.status(500).json({
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  let { username, password } = req.body;

  const sanitizeInput = (input) => String(input).trim();
  username = sanitizeInput(username);
  password = sanitizeInput(password);

  logger.info(`[AUTH] Login attempt for username: ${username || "unknown"}.`);

  if (!username || !password) {
    logger.warn(`[AUTH] Login failed: Missing username or password.`);
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  if (typeof username !== "string" || username.length < 3) {
    return res.status(400).json({ message: "Invalid username format." });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Invalid password format." });
  }

  try {
    const { rows } = await db.query(
      "SELECT * FROM users WHERE username = $1 LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      logger.warn(
        `[AUTH] Login failed: User not found for username: ${
          username ?? "unknown"
        }`
      );

      return res
        .status(401)
        .json({ message: "Invalid credentials or user not authorized." });
    }

    const user = rows[0];

    if (!user.authorized) {
      logger.warn(
        `[AUTH] Login failed: User '${username}' is not authorized to log in.`
      );
      return res.status(403).json({
        message: "Account not authorized. Please contact an administrator.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(
        `[AUTH] Login failed: Invalid password for username: ${username}`
      );
      return res
        .status(401)
        .json({ message: "Invalid credentials or user not authorized." });
    }

    const tokenPayload = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.ADMIN_JWT_SECRET, {
      expiresIn: "365d",
    });

    logger.info(`[AUTH] Login successful for user: ${username}`);

    res.status(200).json({
      message: "Admin login successful!",
      token: token,
      admin: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    logger.error(
      `[AUTH] Server error during login for user ${username}: ${error.message}`
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.logout = (req, res) => {
  try {
    res.cookie("authToken", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error(`[AUTH] Server error during logout: ${error.message}`);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
