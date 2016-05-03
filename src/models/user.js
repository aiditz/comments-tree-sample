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

schema.statics.PUBLIC_FIELDS = {hash: 0, __v: 0};

schema.methods.validPassword = function (password) {
    return passwordHash.verify(password, this.hash);
};

schema.methods.generateJwt = function () {
    return jwt.sign({_id: this._id.toString()}, config.jwt.secret, config.jwt.options);
};

schema.methods.incCommentsCounter = function () {
    this.comments_count++;
    return this.save();
};

var UserMongooseModel = mongoose.model('user', schema);

class UserModel extends UserMongooseModel {

    static register(login, password, profile) {
        return UserMongooseModel.findOne({login: login}, {_id: 1}).lean().then((doc) => {
            if (doc) {
                throw new Error('Username is busy');
            }

            var user = new UserMongooseModel(profile);
            user.login = login;
            user.hash = passwordHash.generate(password);
            if (!user.name) {
                user.name = login;
            }
            return user.save().then((doc) => {
                return doc.generateJwt();
            });
        });
    }

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

    static sortedByComments() {
        return UserMongooseModel.find({}, this.PUBLIC_FIELDS).sort({comments_count: -1}).limit(1000).exec();
    }

}

module.exports = UserModel;