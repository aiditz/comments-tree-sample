'use strict';

var config = require('../config');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var UserModel = require('../models/user');

passport.use(new LocalStrategy({
    usernameField: 'login'
}, function (username, password, done) {
    UserModel.login(username, password).then((token) => {
        return done(null, token);
    }).catch(done);
}));

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.versionOneCompatibility({
        tokenQueryParameterName: 'token',
        tokenBodyField: 'token'
    }),
    secretOrKey: config.jwt.secret
}, function (jwt_payload, done) {
    UserModel.findById(jwt_payload._id, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
}));