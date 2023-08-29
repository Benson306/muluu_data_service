let mongoose = require('mongoose');

let sitesSchema = new mongoose.Schema({}, { strict: false});

let SitesModel = mongoose.model('sites', sitesSchema);

module.exports = SitesModel;