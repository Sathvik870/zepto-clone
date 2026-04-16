const express = require("express");
const router = express.Router();
const {
  getAllPurchaseOrders,
  getPurchaseOrderDetails,
  createPurchaseOrder,
} = require("../../controllers/admin/purchase.controllers");
const { protect } = require("../../middleware/adminAuth.middleware");

router.use(protect);

router.route("/").get(getAllPurchaseOrders).post(createPurchaseOrder);

router.get("/:code/details", getPurchaseOrderDetails);

module.exports = router;
