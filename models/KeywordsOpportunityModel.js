let mongoose = require('mongoose');

let keywordOpportunitySchema = new mongoose.Schema({}, { strict: false});

let KeywordOpportunityModel = mongoose.model('keyword_opportunity', keywordOpportunitySchema);

module.exports = KeywordOpportunityModel;