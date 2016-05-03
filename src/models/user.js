'use strict';

var config = require('../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');

var schema = new Schema({
    login: {
        type: String,
        minlength: 3,
        trim: true,
        required: true
    },
    hash: {type: String, required: true},
    name: {type: String, trim: true},
    comments_count: {type: Number, default: 0}
});

schema.index({login: 1}, {unique: true});

/**
 * Public profile fields in Mongo format
 * @type {Object}
 */
schema.statics.PUBLIC_FIELDS = {hash: 0, __v: 0};

/**
 * Generates a token from a user object
 * @param user
 * @returns {String}
 */
schema.statics.generateJwt = function(user) {
    return jwt.sign({_id: user._id.toString()}, config.jwt.secret, config.jwt.options);
};

/**
 * Checks if password is valid
 * @param {String} password
 * @returns {Boolean}
 */
schema.methods.validPassword = function (password) {
    return passwordHash.verify(password, this.hash);
};

/**
 * Generates a token for the user
 * @returns {String}
 */
schema.methods.generateJwt = function () {
    return this.constructor.generateJwt(this);
};

/**
 * Increases user's comments counter
 */
schema.methods.incCommentsCounter = function () {
    this.comments_count++;
    return this.save();
};

var UserMongooseModel = mongoose.model('user', schema);

class UserModel extends UserMongooseModel {

    /**
     * Register a new user
     * @param {String} login
     * @param {String} password
     * @param {Object} profile
     * @returns {Promise.<String>} token to access api
     */
    static register(login, password, profile) {
        var user;
        return Promise.resolve()
            .then(() => {
                if (password.length < 5) {
                    throw new Error('Minimum password length is 5');
                }
                var hash = passwordHash.generate(password);
                user = new UserMongooseModel(profile);
                user.login = login;
                user.hash = hash;
                if (!user.name) {
                    user.name = login;
                }
            })
            .then(() => user.save())
            .then((doc) => {
                return doc.generateJwt();
            }, (err) => {
                if (err.code == 11000) { // duplicate entry
                    throw new Error('Username busy');
                }
                else {
                    throw err;
                }
            });
    }

    /**
     * Log in via login & password
     * @param {String} login
     * @param {String} password
     * @returns {Promise.<String>} token to access api
     */
    static login(login, password) {
        return UserMongooseModel.findOne({login: login}).then((doc) => {
            if (!doc) {
                throw new Error('Incorrect login');
            }

            if (!doc.validPassword(password)) {
                throw new Error('Incorrect password');
            }

            return doc.generateJwt();
        });
    }

    /**
     * Get a list of all users sorted by their comments count
     * @returns {Promise.<[]>}
     */
    static sortedByComments() {
        return UserMongooseModel.find({}, this.PUBLIC_FIELDS).sort({comments_count: -1}).limit(1000).exec();
    }

}

module.exports = UserModel;