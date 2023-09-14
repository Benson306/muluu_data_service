let mongoose = require('mongoose');

//page_ids schema
let industrySchema = new mongoose.Schema({}, {strict: false});

let IndustryKeywordsModel = mongoose.model('industry_keywords', industrySchema);

module.exports = IndustryKeywordsModel;