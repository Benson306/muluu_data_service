let mongoose = require('mongoose');

let TwitterSchema = new mongoose.Schema({}, {strict: false});

let TwitterModel = mongoose.model('twitter', TwitterSchema);

module.exports = TwitterModel;