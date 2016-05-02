'use strict';

var router = require('express').Router();
var mongoose = require('mongoose');
var CommentModel = require('../models/comment');

router.post('/', function(req, res, next) {
    CommentModel.create(req.body)
        .then(res.json.bind(res))
        .catch(next);
});

router.get('/asList', function(req, res, next) {
    CommentModel.getList()
        .then(res.json.bind(res))
        .catch(next);
});

router.get('/asTree', function(req, res, next) {
    CommentModel.getTree()
        .then(res.json.bind(res))
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