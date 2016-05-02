var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    parent: {type: Schema.Types.ObjectId, ref: 'comment'},
    author: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    text: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('comment', schema);