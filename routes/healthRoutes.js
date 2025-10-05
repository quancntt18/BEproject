const express = require("express");
const router = express.Router();

// @route   GET /api/health
// @desc    Kiểm tra trạng thái hoạt động của API, không yêu cầu xác thực
// @access  Public
router.get("/", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "API is running and reachable",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
