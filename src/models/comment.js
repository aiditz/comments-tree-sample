var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    parent: {type: Schema.Types.ObjectId, ref: 'comment'},
    author: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    text: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

var model = mongoose.model('comment', schema);

module.exports.create = function(data) {
    var doc = new model(data);
    return doc.save();
};

module.exports.getList = function() {
    return model.find().lean().exec();
};

module.exports.getTree = function() {
    return model.find().lean().exec().then((doc) => {
        var itemsById = {};
        var root = [];
        doc.forEach((item) => {
            item.children = [];
            itemsById[item._id] = item
        });
        doc.forEach((item) => {
            if (item.parent) {
                if (itemsById[item.parent]) {
                    itemsById[item.parent].children.push(item);
                }
            }
            else {
                root.push(item);
            }
        });
        return root;
    })
};

module.exports.getChildren = function(commentId) {

};
