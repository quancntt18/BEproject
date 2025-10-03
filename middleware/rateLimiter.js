const User = require('../models/UserModel');

const rateLimiter = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).send('Bạn cần đăng nhập để thực hiện chức năng này.');
    }

    const user = await User.findById(req.user.id);
    const now = new Date();

    // Nếu đã qua 1 giờ kể từ lần request cuối, reset bộ đếm
    if (user.lastRequestTime && (now - user.lastRequestTime > 3600000)) {
        user.requestCount = 0;
    }

    if (user.requestCount >= 5) {
        return res.status(429).send('Bạn đã vượt quá giới hạn 5 ảnh trong một giờ.');
    }

    user.requestCount += 1;
    user.lastRequestTime = now;
    await user.save();
    
    next();
};

module.exports = rateLimiter;