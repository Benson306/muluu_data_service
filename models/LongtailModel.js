let mongoose = require('mongoose');

let longtailSchema = new mongoose.Schema({
    longtail_keyword: String,
    score: Number
});

let LongtailModel = mongoose.model('longtail_keywords', longtailSchema);

module.exports = LongtailModel;