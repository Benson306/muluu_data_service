let mongoose = require('mongoose');

let keywordsSchema = new mongoose.Schema({}, { strict: false});

let KeywordsModel = mongoose.model('keywords', keywordsSchema);

module.exports = KeywordsModel;