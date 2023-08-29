let mongoose = require('mongoose');

let pagesSchema = new mongoose.Schema({}, { strict: false});

let PagesModel = mongoose.model('pages', pagesSchema);

module.exports = PagesModel;