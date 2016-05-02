var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var UserModel = require('../models/user');

passport.use(new LocalStrategy(
    function(username, password, done) {
        UserModel.login(username, password).then((user) => {
            return done(null, user);
        }).catch(done);
    }
));