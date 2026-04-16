const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/adminAuth.middleware");
const {
  getDashboardStats,
} = require("../../controllers/admin/dashboard.controller");

router.get("/stats", protect, getDashboardStats);

module.exports = router;
