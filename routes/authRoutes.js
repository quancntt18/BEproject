const router = require('express').Router();
const passport = require('passport');

// Route 1: Bắt đầu quá trình đăng nhập Google
// Khi người dùng click vào nút "Đăng nhập với Google", frontend sẽ điều hướng họ đến đây.
// Passport sẽ tiếp nhận và chuyển hướng người dùng đến trang đăng nhập của Google.
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] // Yêu cầu lấy thông tin profile và email của người dùng
}));

// Route 2: Callback sau khi Google xác thực thành công
// Sau khi người dùng đăng nhập thành công trên trang của Google, Google sẽ chuyển hướng họ về lại URL này.
// Passport middleware sẽ xử lý `code` mà Google gửi về, đổi nó lấy access token và thông tin user.
// Nếu thành công, thông tin user sẽ được lưu vào session, và người dùng được chuyển hướng về trang chủ frontend.
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login/failed' }), (req, res) => {
    // Đăng nhập thành công, chuyển hướng về trang chủ.
    res.redirect(process.env.CLIENT_URL); 
});

// Route 3: Lấy thông tin người dùng hiện tại
// Frontend sẽ gọi API này để kiểm tra xem người dùng đã đăng nhập hay chưa.
// Nếu đã đăng nhập, req.user sẽ chứa thông tin user được lấy từ session.
router.get('/current_user', (req, res) => {
    if (req.user) {
        res.status(200).json(req.user);
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
});

// Route 4: Đăng xuất
// Cần được cập nhật để tương thích với passport v0.6+ và cookie-session
router.get('/logout', (req, res, next) => {
    // req.logout() là một hàm bất đồng bộ, nó cần một hàm callback.
    req.logout(function(err) {
        if (err) { 
            // Nếu có lỗi trong quá trình đăng xuất, chuyển cho bộ xử lý lỗi.
            return next(err); 
        }

        // Sau khi passport dọn dẹp xong, chúng ta xóa session cookie.
        // Với cookie-session, cách thực hiện là gán req.session = null.
        req.session = null;

        // Chuyển hướng người dùng về trang chủ.
        res.redirect(process.env.CLIENT_URL);
    });
});


// (Tùy chọn) Route xử lý khi đăng nhập thất bại
router.get('/login/failed', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Login failure',
    });
});


module.exports = router;