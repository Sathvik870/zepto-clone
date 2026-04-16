const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/adminAuth.middleware");
const { getDailyItemTotals } = require("../../controllers/admin/reports.controller");

router.get("/daily-item-totals", protect, getDailyItemTotals);

module.exports = router;