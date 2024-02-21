let mongoose = require('mongoose');

let keywordsRankingInDomain = new mongoose.Schema({}, { strict: false});

let KeywordsRankingInDomainModel = mongoose.model('keywords_ranking_in_domain', keywordsRankingInDomain);

module.exports = KeywordsRankingInDomainModel;