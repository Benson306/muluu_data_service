let mongoose = require('mongoose');

let CompetitorRankingSchema = new mongoose.Schema({}, {strict: false});

let CompetitorRankingModel = mongoose.model('competitor_ranking', CompetitorRankingSchema);

module.exports = CompetitorRankingModel;