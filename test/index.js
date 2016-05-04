'use strict';

var db = require('../src/core/mongoose').connection;
var server;

before('setup http server and mongo connection', function (done) {
    this.timeout(10000);
    server = require('../src/app');
    server.on('listening', function () {
        if (db.readyState === 1) { // connected
            return done();
        }
        else {
            db.on('connected', done);
        }
    });
});

before(function () {
    return Promise.all([
        db.collection('users').remove(),
        db.collection('comments').remove()
    ]);
});

after(function () {
    return Promise.all([
        db.collection('users').remove(),
        db.collection('comments').remove()
    ]);
});

after(function (done) {
    server.close(done);
});