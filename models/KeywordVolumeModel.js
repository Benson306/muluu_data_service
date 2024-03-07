let mongoose = require('mongoose');

let BacklinksSchema = new mongoose.Schema({}, {strict: false});

let BacklinksModel = mongoose.model('keyword_volume', BacklinksSchema);

module.exports = BacklinksModel;