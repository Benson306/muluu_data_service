let mongoose = require('mongoose');

let socialsSchema = new mongoose.Schema({}, { strict: false});

let SocialMediaModel = mongoose.model('social_media', socialsSchema);

module.exports = SocialMediaModel;