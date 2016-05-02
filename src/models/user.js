'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passwordHash = require('password-hash');

var schema = new Schema({
    login: {type: String, required: true},
    hash: {type: String, required: true}
});

schema.index({login: 1}, {unique: true});

schema.methods.validPassword = function(password) {
  return passwordHash.verify(password, this.hash);
};

var model = mongoose.model('user', schema);

module.exports = {

    register: function(login, password, profile) {
        return model.findOne({login: login}, {_id: 1}).lean().then((doc) => {
            if (doc) {
                throw new Error('Username is busy');
            }

            var user = new model(profile);
            user.login = login;
            user.hash = passwordHash.generate(password);
            return user.save();
        })
    },

    login: function(login, password) {
        return model.findOne({login: login}).then((doc) => {
            if (!doc) {
                throw new Error('Incorrect login');
            }

            if (!doc.validPassword(password)) {
                throw new Error('Incorrect password');
            }

            return doc;
        })
    }
};