// --- BƯỚC 1: IMPORT CÁC THƯ VIỆN VÀ MODULE CẦN THIẾT ---
console.log("---[1] BẮT ĐẦU FILE SERVER.JS ---");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const passport = require("passport");

// Import các file routes và cấu hình của ứng dụng
const authRoutes = require("./routes/authRoutes");
const imageRoutes = require("./routes/imageRoutes");
const healthRoutes = require("./routes/healthRoutes");
require("./config/Passports"); // Chạy file để cấu hình Passport

// --- BƯỚC 2: KHỞI TẠO ỨNG DỤNG EXPRESS ---
const app = express();
const PORT = process.env.PORT || 8000;

// --- BƯỚC 3: CẤU HÌNH CÁC MIDDLEWARE ---

// Cho phép Cross-Origin Resource Sharing (CORS) để frontend có thể gọi API
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Chỉ cho phép domain của frontend
    credentials: true, // Cho phép gửi cookie
  })
);

// Middleware để phân tích body của request dưới dạng JSON
app.use(express.json());
// Middleware để phân tích body của request từ form (URL-encoded)
app.use(express.urlencoded({ extended: true }));
console.log("---[2] TRƯỚC KHI CẤU HÌNH SESSION ---");

// Cấu hình session bằng cookie-session
app.use(
  cookieSession({
    name: "gemini-session",
    keys: [process.env.SESSION_SECRET], // Khóa bí mật để mã hóa cookie
    maxAge: 24 * 60 * 60 * 1000, // Session tồn tại trong 24 giờ
  })
);
console.log("---[3] SAU KHI CẤU HÌNH COOKIE-SESSION ---");
app.use(function (request, response, next) {
  console.log("---[4] BÊN TRONG MIDDLEWARE VÁ LỖI ---");
  if (request.session && !request.session.regenerate) {
    request.session.regenerate = (cb) => {
      cb();
    };
  }
  if (request.session && !request.session.save) {
    request.session.save = (cb) => {
      cb();
    };
  }
  next();
});
console.log("---[5] TRƯỚC KHI KHỞI TẠO PASSPORT ---");

// Khởi tạo Passport và sử dụng session để quản lý đăng nhập
app.use(passport.initialize());
app.use(passport.session());
console.log("---[6] SAU KHI KHỞI TẠO PASSPORT ---");

// Middleware để phục vụ các file tĩnh (ảnh đã upload hoặc được tạo ra)
app.use("/uploads", express.static("uploads"));
app.use("/generated", express.static("generated"));
app.use("/api/health", healthRoutes);

// --- BƯỚC 4: ĐĂNG KÝ CÁC API ROUTES ---

// Gắn các route xác thực (login, logout,...) vào đường dẫn /auth
app.use("/auth", authRoutes);

// Gắn các route xử lý ảnh (generate, history,...) vào đường dẫn /api/image
// URL cuối cùng sẽ là /api/image/generate, /api/image/history, v.v.
app.use("/api/image", imageRoutes);
console.log("---[7] ĐÃ ĐĂNG KÝ ROUTES ---");

// --- BƯỚC 5: KẾT NỐI CƠ SỞ DỮ LIỆU VÀ KHỞI CHẠY SERVER ---

// Kiểm tra biến môi trường MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error(
    "FATAL ERROR: Biến MONGODB_URI chưa được thiết lập trong file .env!"
  );
  process.exit(1); // Thoát ứng dụng nếu không có link DB
}

// Kết nối tới MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công!");

    // Chỉ khởi chạy server sau khi đã kết nối DB thành công
    app.listen(PORT, () => {
      console.log(`✅ Server đã chạy thành công trên port ${PORT}`);
      console.log(`🚀 API sẵn sàng tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    process.exit(1); // Thoát ứng dụng nếu kết nối DB thất bại
  });
