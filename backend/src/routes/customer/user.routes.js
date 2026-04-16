const express = require("express");
const router = express.Router();
const {
  getCustomerProfile,
  updateCustomerLocation,
  updateCustomerProfile,
  checkUsername,
} = require("../../controllers/customer/user.controller");
const { protectCustomer } = require("../../middleware/customerAuth.middleware");

router.get("/profile", protectCustomer, getCustomerProfile);
router.put("/profile", protectCustomer, updateCustomerProfile);

router.put("/location", protectCustomer, updateCustomerLocation);
router.post("/check-username", protectCustomer, checkUsername);

module.exports = router;
