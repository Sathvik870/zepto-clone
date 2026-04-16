const express = require("express");
const router = express.Router();
const { subscribeCustomer,unsubscribeCustomer } = require("../../utils/common/pushService");
const { protectCustomer } = require("../../middleware/customerAuth.middleware");

router.post("/subscribe", protectCustomer, async (req, res) => {
  const customerId = req.customer.customer_id;
  await subscribeCustomer(req.body, customerId);
  res.status(201).json({ message: "Subscribed for notifications" });
});

router.post("/unsubscribe", protectCustomer, async (req, res) => {
  await unsubscribeCustomer(req.body);
  res.status(200).json({ message: "Unsubscribed successfully" });
});

module.exports = router;