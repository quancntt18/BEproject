/**
 * Middleware để kiểm tra xem người dùng đã được xác thực (đăng nhập) hay chưa.
 * Middleware này sử dụng hàm req.isAuthenticated() do Passport.js cung cấp,
 * đây là cách kiểm tra đáng tin cậy nhất.
 */
const isAuthenticated = (req, res, next) => {
    // req.isAuthenticated() sẽ trả về `true` nếu session của người dùng hợp lệ,
    // và `false` nếu ngược lại.
    if (req.isAuthenticated()) {
        // Nếu người dùng đã đăng nhập, cho phép request tiếp tục đi đến
        // middleware hoặc controller tiếp theo trong chuỗi xử lý.
        return next();
    }

    // Nếu người dùng chưa đăng nhập, từ chối request.
    // Trả về mã trạng thái 401 Unauthorized cùng với một thông báo lỗi rõ ràng.
    // Điều này giúp phía frontend biết rằng cần phải yêu cầu người dùng đăng nhập.
    res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Access is denied due to invalid credentials.' 
    });
};

// Export middleware để có thể sử dụng ở các file khác (ví dụ: trong imageRoutes.js)
module.exports = isAuthenticated;