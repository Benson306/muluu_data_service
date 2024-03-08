let mongoose = require('mongoose');

let InstragamSchema = new mongoose.Schema({}, {strict: false});

let InstagramModel = mongoose.model('instagram', InstragamSchema);

module.exports = InstagramModel;