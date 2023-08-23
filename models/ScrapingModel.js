let mongoose = require('mongoose');

let scrapingbotSchema = new mongoose.Schema({}, { strict: false});

let ScrapingModel = mongoose.model('scrapingbot', scrapingbotSchema);

module.exports = ScrapingModel;