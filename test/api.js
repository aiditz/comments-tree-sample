'use strict';

var expect = require('chai').expect;
var request = require('request');
var ObjectId = require('mongoose').Types.ObjectId;

var UserModel = require('../src/models/user');

var url = 'http://localhost:3000';

const COMMENTS_COUNT = 30;
const COMMENTS_NEST_FACTOR = 5; // create subtree every N comments

describe('API:', function () {
    var testTokens = [];

    it('GET /', function (done) {
        request(url, function (error, response, body) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    describe('/users', function () {
        describe('/register', function () {
            [1, 2, 3, 4, 5].forEach(function (index) {
                it('successful registration #' + index, function (done) {
                    request.post({
                        url: url + '/users/register',
                        form: {
                            login: 'login' + index + '@test.ru',
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

            it('error: busy username', function (done) {
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

            it('error: too short password', function (done) {
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

            it('error: incorrect login', function (done) {
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

            it('error: incorrect password', function (done) {
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
    });

    describe('/comments', function () {
        var currentDepth = 0;
        var parentCommentId = '';

        describe('post comment', function () {
            for (let i = 0; i < COMMENTS_COUNT; i++) {
                it('successful post comment #' + i, function (done) {
                    var tokenIndex = (i + Math.floor(Math.random() * testTokens.length));
                    request.post({
                        url: url + '/comments',
                        form: {
                            parent: parentCommentId,
                            text: 'test comment #' + i,
                            token: testTokens[tokenIndex % testTokens.length]
                        }
                    }, function (error, response, body) {
                        var json = JSON.parse(body);
                        expect(json).to.be.a('string')
                            .that.has.lengthOf(24);
                        expect(response.statusCode).to.equal(200);

                        // we need to go deeper...
                        if (i % COMMENTS_NEST_FACTOR === 0) {
                            if (i > 0) {
                                parentCommentId = json;
                            }
                            currentDepth++;
                        }

                        done();
                    });
                });
            }

            it('error: incorrect token', function (done) {
                request.post({
                    url: url + '/comments',
                    form: {
                        text: 'test comment',
                        token: testTokens[0] + 'incorrect'
                    }
                }, function (error, response, body) {
                    expect(response.statusCode).to.equal(401);
                    done();
                });
            });

            it('error: correct token of non-existent user', function (done) {
                var userId = new ObjectId();
                var token = UserModel.generateJwt({_id: userId});
                request.post({
                    url: url + '/comments',
                    form: {
                        text: 'test comment',
                        token: token
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
            it('get root comments tree', function (done) {
                this.timeout(10000);
                request(url + '/comments/asTree', function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.an('array').and.length.at.most(COMMENTS_NEST_FACTOR + 1);
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
            it('get comments subtree', function (done) {
                request(url + '/comments/asTree?commentId=' + parentCommentId, function (error, response, body) {
                    var json = JSON.parse(body);
                    expect(json).to.be.an('array');
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });

        ['depth', 'depth2', 'depth3'].forEach(function (method) {
            describe('/' + method, function () {
                it('get root tree maximum depth', function (done) {
                    this.timeout(10000);
                    request(url + '/comments/' + method, function (error, response, body) {
                        var json = JSON.parse(body);
                        expect(json).to.be.a('number').that.equal(currentDepth);
                        expect(response.statusCode).to.equal(200);
                        done();
                    });
                });
                it('get last subtree depth', function (done) {
                    this.timeout(10000);
                    request(url + '/comments/' + method + '?commentId=' + parentCommentId, function (error, response, body) {
                        var json = JSON.parse(body);
                        expect(json).to.be.a('number').that.equal(2);
                        expect(response.statusCode).to.equal(200);
                        done();
                    });
                });
            });
        });
    });

    describe('/users', function () {
        describe('/sortedByComments', function () {
            it('should get a list of users sorted by comments count', function (done) {
                request(url + '/users/sortedByComments', function (error, response, body) {
                    var currentValue;
                    var previousValue;
                    var i;
                    var json = JSON.parse(body);

                    expect(json).to.be.an('array')
                        .that.has.lengthOf(5);

                    // check that the array is sorted
                    previousValue = json[0].comments_count;
                    for (i = 1; i < json.length; i++) {
                        currentValue = json[i].comments_count;
                        expect(currentValue).to.be.at.most(previousValue);
                        previousValue = currentValue;
                    }

                    expect(error).to.not.exists;
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    })

});