let mongoose = require('mongoose');

//page_ids schema
let industrySchema = new mongoose.Schema({}, {strict: false});

let industryModel = mongoose.model('industry_keywords', industrySchema);

module.exports = industryModel;