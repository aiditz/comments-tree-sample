'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debugDepth = require('debug')('models/comment/depth');

var schema = new Schema({
    parent: {type: Schema.Types.ObjectId, ref: 'comment'},
    author: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    text: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

schema.index({parent: 1});

var model = mongoose.model('comment', schema);

module.exports = {

    create: function (data) {
        var doc = new model(data);
        return doc.save();
    },

    getList: function () {
        return model.find().lean().exec();
    },

    getTree: function () {
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
    },

    getSubtreeDepth: function(commentId) {
        if (!commentId) {
            commentId = null;
        }
        if (typeof commentId === 'string') {
            commentId = new mongoose.Types.ObjectId(commentId);
        }
        debugDepth(`called getSubtreeDepth(${commentId})`);
        return model.find({parent: commentId}, {_id: 1}).lean().then((doc) => {
            debugDepth(`found ${doc.length} children of comment #${commentId}`);
            if (doc.length === 0) {
                return 1;
            }
            else {
                let promises = [];
                let i;
                for (i = 0; i < doc.length; i++) {
                    promises.push(this.getSubtreeDepth(doc[i]._id))
                }
                return Promise.all(promises).then((results) => {
                    var result = 1 + Math.max.apply(null, results);
                    debugDepth(`children depths of comment #${commentId}: ${results}; subtree depth: ${result}`);
                    return result;
                })
            }
        })
    }
};