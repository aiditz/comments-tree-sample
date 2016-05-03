var expect = require('chai').expect;
var request = require('request');
var db = require('../src/core/mongoose').connection;
var url = 'http://localhost:3000';
var server;

describe('API: ', function () {

    before('setup http server and mongo connection', function (done) {
        this.timeout(3000);
        server = require('../src/app');
        server.on('listening', function() {
            if (db.readyState === 1) { // connected
                console.log('db connected');
                return done();
            }
            else {
                db.on('connected', done);
            }
        });
    });

    before('clear data', function () {
        return Promise.all([
            () => db.collection('users').remove(),
            () => db.collection('comments').remove()
        ]);
    });

    after('clear data', function () {
        return Promise.all([
            () => db.collection('users').remove(),
            () => db.collection('comments').remove()
        ]);
    });

    after('close http server', function (done) {
        server.close(done);
    });

    it('GET /', function (done) {
        request(url, function (error, response, body) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

});