const router = require('express').Router();
const multer = require('multer');
const imageController = require('../controller/imageController');
const rateLimiter = require('../middleware/rateLimiter');
const isAuthenticated = require('../middleware/isAuthenticated'); // Middleware kiểm tra đăng nhập

// Cấu hình multer để lưu file
const upload = multer({ dest: 'uploads/' });



// Định nghĩa các routes
router.post('/generate', isAuthenticated, upload.array('images', 3), rateLimiter, imageController.generateImage);
router.get('/history', isAuthenticated, imageController.getHistory);
//
router.get('/test', (req, res) => {
    res.status(200).send('Image routes test OK!');
});
//

console.log('--- DEBUGGING IMAGE ROUTES ---');
console.log('Kiểm tra isAuthenticated:', typeof isAuthenticated);
console.log('Kiểm tra imageController:', imageController ? 'tồn tại' : 'UNDEFINED');
if (imageController) {
    console.log('Kiểm tra imageController.getHistory:', typeof imageController.getHistory);
}

module.exports = router;