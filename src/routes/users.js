'use strict';

var UserModel = require('../models/user');
var passport = require('passport');
var router = require('express').Router();

router.post('/register', function (req, res, next) {
    var data = req.body;
    UserModel.register(data.login, data.password, {name: data.name})
        .then((token) => res.json({token: token}))
        .catch(next);
});

router.post('/login',
    passport.authenticate('local', {session: false}),
    function (req, res, next) {
        res.json({token: req.user});
    }
);

router.get('/sortedByComments', function (req, res, next) {
    UserModel.sortedByComments()
        .then(res.json.bind(res))
        .catch(next);
});

module.exports = router;