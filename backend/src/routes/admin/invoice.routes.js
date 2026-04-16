const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/adminAuth.middleware");
const { getAllInvoices, updateInvoicePayment } = require("../../controllers/admin/invoice.controller");

router.get("/", protect, getAllInvoices);
router.put("/:id/payment", protect, updateInvoicePayment);

module.exports = router;