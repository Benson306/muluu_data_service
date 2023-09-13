let mongoose = require('mongoose');

//page_ids schema
let idsSchema = new mongoose.Schema({}, {strict: false});

let IdsModel = mongoose.model('industry_keywords', idsSchema);

module.exports = IdsModel;