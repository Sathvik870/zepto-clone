const express = require("express");
const router = express.Router();
const { getUserProfile } = require("../../controllers/admin/user.controller");
const { protect } = require("../../middleware/adminAuth.middleware");

router.get("/profile", protect, getUserProfile);

module.exports = router;
