var expect = require('chai').expect;
var request = require('request');
var db = require('../src/core/mongoose').connection;
var url = 'http://localhost:3000';
var server;

describe('API:', function () {

    before('setup http server and mongo connection', function (done) {
        this.timeout(3000);
        server = require('../src/app');
        server.on('listening', function() {
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

    it('GET /', function (done) {
        request(url, function (error, response, body) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    it('/users/register', function (done) {
        request.post({
            url: url + '/users/register',
            form: {
                login: 'test@test.ru',
                password: '123',
                name: 'test'
            }
        }, function (error, response, body) {
            expect(error).to.not.exists;
            expect(response.statusCode).to.equal(200);
            var json = JSON.parse(body);
            expect(json).to.be.an('object')
                .with.property('token')
                    .that.is.a('string')
                    .that.length.of.at.least(20);
            done();
        });
    });

    it('/users/login', function (done) {
        request.post({
            url: url + '/users/login',
            form: {
                login: 'test@test.ru',
                password: '123'
            }
        }, function (error, response, body) {
            expect(error).to.not.exists;
            expect(response.statusCode).to.equal(200);
            var json = JSON.parse(body);
            expect(json).to.be.an('object')
                .with.property('token')
                    .that.is.a('string')
                    .that.length.of.at.least(20);
            done();
        });
    });

});