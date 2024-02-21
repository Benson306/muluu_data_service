let mongoose = require('mongoose');

let KeywordCompetitionSchema = new mongoose.Schema({}, {strict: false});

let KeywordsCompetitionModel = mongoose.model('keyword_competition', KeywordCompetitionSchema);

module.exports = KeywordsCompetitionModel;