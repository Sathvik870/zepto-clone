const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      req.admin = decoded;
      
      logger.info(`[ADMIN_AUTH_MIDDLEWARE] Token verified for admin: ${decoded.username}`);
      
      next();

    } catch (error) {
      logger.error(`[ADMIN_AUTH_MIDDLEWARE] Token verification failed: ${error.message}`);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    logger.warn("[ADMIN_AUTH_MIDDLEWARE] Access denied: No token in header.");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
