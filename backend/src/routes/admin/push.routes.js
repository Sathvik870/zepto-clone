const express = require("express");
const router = express.Router();
const { subscribeAdmin, unsubscribeAdmin } = require("../../utils/common/pushService");
const { protect } = require("../../middleware/adminAuth.middleware");

router.post("/subscribe", protect, async (req, res) => {
  await subscribeAdmin(req.body);
  res.status(201).json({ message: "Subscribed for notifications" });
});

router.post("/unsubscribe", protect, async (req, res) => {
  await unsubscribeAdmin(req.body);
  res.status(200).json({ message: "Unsubscribed successfully" });
});

module.exports = router;