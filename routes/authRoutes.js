const router = require("express").Router();
const passport = require("passport");

// Route 1: Bắt đầu đăng nhập
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Route 2: Callback sau khi xác thực
// Giữ phiên bản đơn giản này, nó sẽ hoạt động với middleware vá lỗi
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login/failed" }),
  (req, res) => {
    // Đăng nhập thành công, chuyển hướng về trang chủ
    res.redirect(process.env.CLIENT_URL);
  }
);

// Route 3: Lấy thông tin người dùng
router.get("/current_user", (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});

// Route 4: Đăng xuất
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session = null;
    res.redirect(process.env.CLIENT_URL);
  });
});

module.exports = router;
