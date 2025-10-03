const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String,
    requestCount: { type: Number, default: 0 },
    lastRequestTime: Date,
});
module.exports = mongoose.model('User', userSchema);