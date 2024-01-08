let mongoose = require('mongoose');

let NewSocialsSchema = new mongoose.Schema({}, { strict: false});

let NewSocialMediaModel = mongoose.model('new_social_media', NewSocialsSchema);

module.exports = NewSocialMediaModel;