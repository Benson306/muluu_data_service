let mongoose = require('mongoose');

let LinkedinSchema = new mongoose.Schema({}, {strict: false});

let LinkedinModel = mongoose.model('linkedin', LinkedinSchema);

module.exports = LinkedinModel;