'use strict';

var expect = require('chai').expect;
var request = require('request');
var db = require('../src/core/mongoose').connection;
var url = 'http://localhost:3000';
var server;

var testTokens = [];
var testCommentId = null;

describe('API:', function () {

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

    it('GET /', function (done) {
        request(url, function (error, response, body) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    describe('/users', function () {
        describe('/register', function () {
            [1, 2, 3, 4, 5].forEach(function (item) {
                it('successful registration #' + item, function (done) {
                    request.post({
                        url: url + '/users/register',
                        form: {
                            login: 'login' + item + '@test.ru',
                            password: '12345',
                            name: 'test'
                        }
                    }, function (error, response, body) {
                        expect(error).to.not.exists;
                        expect(response.statusCode).to.equal(200);
                        var json = JSON.parse(body);
                        expect(json).to.have.property('token')
                            .that.is.a('string')
                            .that.has.length.of.at.least(20);
                        testTokens.push(json.token);
                        done();
                    });
                });
            });

            it('busy username', function (done) {
                request.post({
                    url: url + '/users/register',
                    form: {
                        login: 'login1@test.ru',
                        password: '12345'
                    }
                }, function (error, response, body) {
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(500);
                    var json = JSON.parse(body);
                    expect(json).to.have.property('error');
                    done();
                });
            });

            it('too short password', function (done) {
                request.post({
                    url: url + '/users/register',
                    form: {
                        login: 'test@test.ru',
                        password: '1'
                    }
                }, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.have.property('error');
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(500);
                    done();
                });
            });

            it('too short login', function (done) {
                request.post({
                    url: url + '/users/register',
                    form: {
                        login: 't',
                        password: '12345'
                    }
                }, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.have.property('error');
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(500);
                    done();
                });
            });
        });

        describe('/login', function () {
            it('successful login', function (done) {
                request.post({
                    url: url + '/users/login',
                    form: {
                        login: 'login1@test.ru',
                        password: '12345'
                    }
                }, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.an('object')
                        .with.property('token')
                        .that.is.a('string')
                        .that.has.length.of.at.least(20);
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });

            it('incorrect login', function (done) {
                request.post({
                    url: url + '/users/login',
                    form: {
                        login: 'incorrect@test.ru',
                        password: '12345'
                    }
                }, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.have.property('error');
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(500);
                    done();
                });
            });

            it('incorrect password', function (done) {
                request.post({
                    url: url + '/users/login',
                    form: {
                        login: 'login1@test.ru',
                        password: 'incorrect'
                    }
                }, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.have.property('error');
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(500);
                    done();
                });
            });
        });

        describe('/sortedByComments', function () {
            it('should get a list of users sorted by comments count', function (done) {
                request(url + '/users/sortedByComments', function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.an('array')
                        .that.has.lengthOf(5);
                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });

    describe('/comments', function () {
        const COMMENTS_COUNT = 100;
        const NEST_FACTOR = 10; // create subtree every n comments
        var currentDepth = 0;
        var parentCommentId = '';

        describe('post comment', function () {
            for (let i = 0; i < COMMENTS_COUNT; i++) {
                it('successful post comment #' + i, function (done) {
                    request.post({
                        url: url + '/comments',
                        form: {
                            parent: parentCommentId,
                            text: 'test comment #' + i,
                            token: testTokens[i % testTokens.length]
                        }
                    }, function (error, response, body) {
                        var json = JSON.parse(body);
                        expect(json).to.be.a('string')
                            .that.has.lengthOf(24);
                        expect(response.statusCode).to.equal(200);

                        // we need to go deeper...
                        if (i % NEST_FACTOR === 0) {
                            currentDepth++;
                            if (i > 0) {
                                parentCommentId = json;
                            }
                        }

                        done();
                    });
                });
            }

            it('pass incorrect token', function (done) {
                request.post({
                    url: url + '/comments',
                    form: {
                        parent: parentCommentId,
                        text: 'test comment',
                        token: testTokens[0] + 'incorrect'
                    }
                }, function (error, response, body) {
                    expect(response.statusCode).to.equal(401);
                    done();
                });
            })
        });

        describe('/asList', function () {
            it('get comments list', function (done) {
                request(url + '/comments/asList', function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.an('array').that.has.lengthOf(COMMENTS_COUNT);
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });

        describe('/asTree', function () {
            it('get comments tree', function (done) {
                this.timeout(10000);
                request(url + '/comments/asTree', function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.have.deep.property('[' + NEST_FACTOR + '].children[0].children');
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });

        describe('/depth', function () {
            it('get root tree maximum depth', function (done) {
                this.timeout(10000);
                request(url + '/comments/depth', function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.a('number', currentDepth);
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
            it('get last subtree depth', function (done) {
                this.timeout(10000);
                request(url + '/comments/depth?commentId=' + parentCommentId, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.a('number', 2);
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });

    });

});