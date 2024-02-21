let mongoose = require('mongoose');

let BacklinksSchema = new mongoose.Schema({}, {strict: false});

let BacklinksModel = mongoose.model('backlinks', BacklinksSchema);

module.exports = BacklinksModel;