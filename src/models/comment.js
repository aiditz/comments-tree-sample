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

var CommentMongooseModel = mongoose.model('comment', schema);

class CommentModel extends CommentMongooseModel {

    static create (data) {
        var doc = new CommentMongooseModel(data);
        return doc.save();
    }

    static getList () {
        return CommentMongooseModel.find().lean().exec();
    }

    static getTree () {
        return CommentMongooseModel.find().populate('author', { _id: 1, login: 1 }).lean().exec().then((doc) => {
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
    }

    static getSubtreeDepth(commentId) {
        if (!commentId) {
            commentId = null;
        }
        if (typeof commentId === 'string') {
            commentId = new mongoose.Types.ObjectId(commentId);
        }
        return CommentMongooseModel.find({parent: commentId}, { _id: 1 }).populate('author').lean().then((doc) => {
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
                    return 1 + Math.max.apply(null, results);
                })
            }
        })
    }
}

module.exports = CommentModel;