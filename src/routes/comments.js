'use strict';

var passport = require('passport');
var router = require('express').Router();
var mongoose = require('mongoose');
var CommentModel = require('../models/comment');
var UserModel = require('../models/user');

router.post('/',
    passport.authenticate('jwt', {session: false}),
    function (req, res, next) {
        req.body.author = req.user._id;
        if (!req.body.parent) {
            delete req.body.parent;
        }
        CommentModel.create(req.body)
            .then((doc) => {
                return req.user.incCommentsCounter().then(() => {
                    return res.json(doc._id);
                });
            })
            .catch(next);
    }
);

router.get('/asList', function (req, res, next) {
    CommentModel.getList()
        .then(res.json.bind(res))
        .catch(next);
});

router.get('/asTree', function (req, res, next) {
    CommentModel.getTree()
        .then(res.json.bind(res))
        .catch(next);
});

router.get('/depth',
    function (req, res, next) {
        CommentModel.getSubtreeDepth(req.query.commentId)
            .then(res.json.bind(res))
            .catch(next);
    }
);

router.get('/depth2',
    function (req, res, next) {
        CommentModel.getSubtreeDepth2(req.query.commentId)
            .then(res.json.bind(res))
            .catch(next);
    }
);

router.get('/depth3',
    function (req, res, next) {
        CommentModel.getSubtreeDepth3(req.query.commentId)
            .then(res.json.bind(res))
            .catch(next);
    }
);

module.exports = router;