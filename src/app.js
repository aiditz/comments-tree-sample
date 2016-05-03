'use strict';

var config = require('./config');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');

var app = express();
var port = process.env.PORT || 3000;
var server = http.createServer(app);

initCore();
initExpress();
initRoutes();
startServer();

function initCore() {
    require('./core/mongoose.js');
    require('./core/passport.js');
}

function initExpress() {
    app.set('json spaces', 4);
    app.use(passport.initialize());
    app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
}

function initRoutes() {
    app.use('/users', require('./routes/users'));
    app.use('/comments', require('./routes/comments'));
    app.use(require('./routes/error'));
}

function startServer() {
    server.listen(port, onListen);
}

function onListen() {
    console.log('listening http on *:' + port);
}

module.exports = server;