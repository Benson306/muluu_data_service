let mongoose = require('mongoose');

let longtailSchema = new mongoose.Schema({},{ strict: false });

let LongtailModel = mongoose.model('longtail_keywords', longtailSchema);

module.exports = LongtailModel;