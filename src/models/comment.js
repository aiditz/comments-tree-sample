'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debugDepth = require('debug')('models/comment/depth');
var ObjectId = mongoose.Types.ObjectId;

var schema = new Schema({
    parent: {type: Schema.Types.ObjectId, ref: 'comment'},
    parents: [{type: Schema.Types.ObjectId}], // for another method of depth calculation
    author: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    text: {type: String, required: true},
    date: {type: Date, default: Date.now}
});

schema.index({parent: 1});

var CommentMongooseModel = mongoose.model('comment', schema);

class CommentModel extends CommentMongooseModel {

    /**
     * Create a comment
     * @param {Object} data
     * @returns {Promise.<CommentMongooseModel>} created comment
     */
    static create(data) {
        return Promise.resolve()
            .then(() => {
                if (data.parent) {
                    // Need to retrieve parent's parents
                    return CommentMongooseModel.findById({_id: data.parent}, {parents: 1}).lean()
                        .then((doc) => {
                            if (!doc) {
                                return new Error('Parent comment isn\'t exists');
                            }
                            var parents = doc.parents? doc.parents : [];
                            parents.push(doc._id);
                            return parents;
                        });
                }
                else {
                    return null;
                }
            })
            .then((parents) => {
                var doc = new CommentMongooseModel(data);
                if (parents) {
                    doc.parents = parents;
                }
                return doc.save();
            });
    }

    /**
     * Get all the comments as an array
     * @returns {Promise.<[CommentMongooseModel]>}
     */
    static getList() {
        return CommentMongooseModel.find().lean().exec();
    }


    /**
     * Get all the comments as a tree
     * @returns {Promise.<[CommentMongooseModel]>}
     */
    static getTree() {
        return CommentMongooseModel.find().populate('author', {_id: 1, login: 1}).lean().exec().then((docs) => {
            var itemsById = {};
            var root = [];
            var i;
            var item;
            for (i = 0; i < docs.length; i++) {
                item = docs[i];
                item.children = [];
                itemsById[item._id] = item;
            }
            for (i = 0; i < docs.length; i++) {
                item = docs[i];
                if (item.parent) {
                    if (itemsById[item.parent]) {
                        itemsById[item.parent].children.push(item);
                    }
                }
                else {
                    root.push(item);
                }
            }
            return root;
        });
    }

    /**
     * Method 1: full scan
     * @param {ObjectId|String|null} commentId root comment
     * @returns {Promise.<Number>}
     */
    static getSubtreeDepth(commentId) {
        if (!commentId) {
            commentId = null;
        }
        if (typeof commentId === 'string') {
            commentId = new ObjectId(commentId);
        }
        return CommentMongooseModel.find({parent: commentId}, {_id: 1}).lean().then((docs) => {
            if (docs.length === 0) {
                return 1;
            }
            else {
                let promises = [];
                let i;
                for (i = 0; i < docs.length; i++) {
                    promises.push(this.getSubtreeDepth(docs[i]._id));
                }
                return Promise.all(promises).then((results) => {
                    return 1 + Math.max.apply(null, results);
                });
            }
        });
    }

    /**
     * Method 2: using comment.parents field
     * @param {ObjectId|String|null} commentId root comment
     * @returns {Promise.<Number>}
     */
    static getSubtreeDepth2(commentId) {
        if (!commentId) {
            commentId = null;
        }
        if (typeof commentId === 'string') {
            commentId = new ObjectId(commentId);
        }
        return CommentMongooseModel.findById(commentId, {_id: 1, parents: 1}).lean().then((doc) => {
            return 1 + doc.parents? doc.parents.length : 0;
        });
    }
}

module.exports = CommentModel;