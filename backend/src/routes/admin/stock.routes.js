const express = require("express");
const router = express.Router();
const { batchUpdateStock } = require("../../controllers/admin/stock.controller");
const { protect } = require("../../middleware/adminAuth.middleware");

router.use(protect);

router.put("/batch-update", batchUpdateStock);

module.exports = router;