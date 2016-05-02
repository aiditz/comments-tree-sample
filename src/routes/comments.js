'use strict';

var router = require('express').Router();
var mongoose = require('mongoose');
var CommentModel = require('../models/comment');

router.post('/', function(req, res, next) {
    var comment = new CommentModel(req.body);
    comment.save()
        .then((doc) => {
            res.json(doc._id);
        })
        .catch(next);
});

router.get('/', function(req, res, next) {
    CommentModel.find().exec()
        .then((doc) => {
            res.json(doc);
        })
        .catch(next);
});

router.get('/asTree', function(req, res, next) {
    CommentModel.find().lean().exec()
        .then((doc) => {
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
            res.json(root);
        })
        .catch(next);
});

router.get('/depth', function(req, res, next) {

});

router.get('/add', function(req, res, next) {
    var authorId = new mongoose.Types.ObjectId();
    var html = `<form method="POST" action="/comments">
        <input name="text">
        <input type="hidden" name="author" value="${authorId}">
        <input type="hidden" name="parent" value="572755955749f074527af07b">
        <input type="submit" value="POST">
    `;
    res.send(html);
});

module.exports = router;