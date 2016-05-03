var config = require('../config');
var mongoose = require('mongoose');

mongoose.connect(config.mongoose.url);

module.exports = mongoose;