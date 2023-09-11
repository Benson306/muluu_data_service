let mongoose = require('mongoose');

//page_ids schema
let idsSchema = new mongoose.Schema({}, {strict: false});

let IdsModel = mongoose.model('page_ids', idsSchema);

module.exports = IdsModel;