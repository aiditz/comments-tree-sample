'use strict';

var UserModel = require('../models/user');
var passport = require('passport');
var router = require('express').Router();

router.use('/register', function(req, res, next) {
    var data = req.body;
    if (!data.login) {
        data = req.query;
    }
    UserModel.register(data.login, data.password, { name: data.name })
        .then(res.json.bind(res))
        .catch(next);
});

router.use('/login',
    passport.authenticate('local', { session: false }),
    function(req, res, next) {
        res.json(req.user);
    }
);

router.get('/sortedByComments', function(req, res, next) {

});

module.exports = router;