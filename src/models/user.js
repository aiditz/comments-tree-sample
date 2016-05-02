'use strict';

var config = require('../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');

var schema = new Schema({
    login: {type: String, required: true},
    hash: {type: String, required: true},
    comments_count: {type: Number, default: 0}
});

schema.index({login: 1}, {unique: true});

schema.methods.validPassword = function(password) {
    return passwordHash.verify(password, this.hash);
};

schema.methods.incCommentsCounter = function() {
    this.comments_count++;
    return this.save();
};

schema.methods.generateJwt = function() {
    return jwt.sign({_id: this._id.toString()}, config.jwt.secret, config.jwt.options);
};

var model = mongoose.model('user', schema);

class UserModel extends model {

    static register (login, password, profile) {
        return model.findOne({login: login}, {_id: 1}).lean().then((doc) => {
            if (doc) {
                throw new Error('Username is busy');
            }

            var user = new model(profile);
            user.login = login;
            user.hash = passwordHash.generate(password);
            return user.save().then((doc) => {
                return doc.generateJwt();
            });
        })
    }

    static login (login, password) {
        return model.findOne({login: login}).then((doc) => {
            if (!doc) {
                throw new Error('Incorrect login');
            }

            if (!doc.validPassword(password)) {
                throw new Error('Incorrect password');
            }

            return doc.generateJwt();
        })
    }

}

module.exports = UserModel;