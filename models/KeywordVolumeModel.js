let mongoose = require('mongoose');

let KeywordVolumeSchema = new mongoose.Schema({}, {strict: false});

let KeywordVolumeModel = mongoose.model('keyword_volume', KeywordVolumeSchema);

module.exports = KeywordVolumeModel;