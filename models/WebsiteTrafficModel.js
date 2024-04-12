let mongoose = require('mongoose');

let WebsiteTrafficSchema = new mongoose.Schema({}, {strict: false});

let WebsiteTrafficModel = mongoose.model('website_traffic', WebsiteTrafficSchema);

module.exports = WebsiteTrafficModel;