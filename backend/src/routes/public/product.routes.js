const express = require("express");
const router = express.Router();
const { getSaleableProducts } = require("../../controllers/public/product.controller");

router.get("/saleable", getSaleableProducts);

module.exports = router;