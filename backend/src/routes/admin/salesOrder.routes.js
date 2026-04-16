const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/adminAuth.middleware");
const { 
  getAllSalesOrders, 
  updateOrderStatus,
  updatePaymentStatus 
} = require("../../controllers/admin/salesOrder.controller");

router.get("/", protect, getAllSalesOrders);

router.put("/:id/status", protect, updateOrderStatus);
router.put("/:id/payment-status", protect, updatePaymentStatus);

module.exports = router;