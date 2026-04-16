const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const protectCustomer = (req, res, next) => {
  
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET);
      req.customer = decoded;
      next();
    } catch (error) {
      logger.error(`[CUSTOMER_AUTH_MIDDLEWARE] Token verification failed: ${error.message}`);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    logger.warn("[CUSTOMER_AUTH_MIDDLEWARE] Access denied: No token provided.");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protectCustomer };
