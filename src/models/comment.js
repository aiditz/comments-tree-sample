'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var debugDepth = require('debug')('models/comment/depth');
var ObjectId = mongoose.Types.ObjectId;

var schema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    text: {type: String, required: true},
    parent: {type: Schema.Types.ObjectId, ref: 'comment'},
    parents: [Schema.Types.ObjectId],
    parents_count: {type: Number, default: 0},
    date: {type: Date, default: Date.now}
});

schema.index({parent: 1});
schema.index({parents_count: 1, parents: 1});

var MongooseModel = mongoose.model('comment', schema);

class CommentModel extends MongooseModel {

    /**
     * Create a comment
     * @param {Object} data
     * @returns {Promise.<MongooseModel>} created comment
     */
    static create(data) {
        return Promise.resolve()
            .then(() => {
                if (data.parent) {
                    // Need to retrieve parent's parents
                    return MongooseModel.findById({_id: data.parent}, {parents: 1}).lean()
                        .then((doc) => {
                            if (!doc) {
                                return new Error('Parent comment isn\'t exists');
                            }
                            var parents = doc.parents ? doc.parents : [];
                            parents.push(doc._id);
                            return parents;
                        });
                }
                else {
                    return null;
                }
            })
            .then((parents) => {
                var doc = new MongooseModel(data);
                if (parents && parents.length) {
                    doc.parents = parents;
                    doc.parents_count = parents.length;
                }
                else {
                    doc.parents_count = 0;
                }
                return doc.save();
            });
    }

    /**
     * Get all the comments as an array
     * @returns {Promise.<[MongooseModel]>}
     */
    static getList() {
        return MongooseModel.find({}, {parents: 0, parents_count: 0}).lean();
    }

    /**
     * Get comments as a tree
     * @returns {Promise.<[MongooseModel]>}
     */
    static getTree(commentId) {
        var query = {};
        if (commentId) {
            query = {parents: commentId};
        }
        return MongooseModel
            .find(query, {parents: 0, parents_count: 0})
            .sort({_id: -1})
            .populate('author', {_id: 1, login: 1})
            .lean()
            .then((docs) => {
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
                        else {
                            root.push(item);
                        }
                    }
                    else {
                        root.push(item);
                    }
                }
                return root;
            }
        );
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
        else {
            commentId = new ObjectId(commentId);
        }
        return MongooseModel
            .find({parent: commentId}, {_id: 1})
            .lean()
            .then((docs) => {
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
                        return (commentId ? 1 : 0) + Math.max.apply(null, results);
                    });
                }
            }
        );
    }

    /**
     * Method 2: using 'parents' field
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
        var query = {};
        if (commentId) {
            query = {parents: commentId};
        }

        return Promise.resolve()
            .then(() => {
                if (!commentId) {
                    return 0;
                }
                else {
                    return MongooseModel.findById(commentId, {parents: 1}).exec().then((doc) => {
                        if (!doc) {
                            throw new Error('Comment isn\'t exists');
                        }
                        return doc.parents.length;
                    })
                }
            })
            .then((rootLevel) => {
                return MongooseModel.aggregate([
                    {$match: query},
                    {
                        $project: {
                            _id: 1,
                            parents: {$size: '$parents'}
                        }
                    },
                    {
                        $group: {
                            _id: 1,
                            parents_max: {$max: '$parents'}
                        }
                    },
                    {$limit: 1}
                ]).exec().then((docs) => {
                    if (!docs.length) {
                        return 0;
                    }
                    return 1 + (docs[0].parents_max || 0) - rootLevel;
                });
            });
    }

    /**
     * Method 3: using 'parents_count' field
     * @param {ObjectId|String|null} commentId root comment
     * @returns {Promise.<Number>}
     */
    static getSubtreeDepth3(commentId) {
        if (!commentId) {
            commentId = null;
        }
        else {
            commentId = new ObjectId(commentId);
        }

        return Promise.resolve()
            .then(() => {
                if (!commentId) {
                    return 0;
                }
                else {
                    return MongooseModel.findById(commentId, {parents_count: 1}).exec().then((doc) => {
                        if (!doc) {
                            throw new Error('Comment isn\'t exists');
                        }
                        return doc.parents_count;
                    })
                }
            })
            .then((rootLevel) => {
                var query = {};
                if (commentId) {
                    query = {parents: commentId};
                }
                return MongooseModel.find(query, {parents_count: 1}).sort({parents_count: -1}).limit(1).exec()
                    .then((docs) => {
                        if (!docs.length) {
                            return 0;
                        }
                        return 1 + docs[0].parents_count - rootLevel;
                    })
            });
    }
}

module.exports = CommentModel;