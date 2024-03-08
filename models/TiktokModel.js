let mongoose = require('mongoose');

let TiktokSchema = new mongoose.Schema({}, {strict: false});

let TiktokModel = mongoose.model('tiktok', TiktokSchema);

module.exports = TiktokModel;