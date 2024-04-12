let mongoose = require('mongoose');

let PageSEOSchema = new mongoose.Schema({}, { strict: false});

let PageSEOModel = mongoose.model('page_seo', PageSEOSchema);

module.exports = PageSEOModel;