let mongoose = require('mongoose');

let idsSchema = new mongoose.Schema({}, {strict: false});

let IdsModel = mongoose.model('page_ids', idsSchema);

module.exports = IdsModel;