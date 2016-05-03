'use strict';

var config = require('./config');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');

var app = express();

initExpress();
initCore();
initRoutes();
startServer();

function initExpress() {
    app.set('json spaces', 4);
    app.use(passport.initialize());
    app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
}

function initCore() {
    mongoose.connect(config.mongoose.url);
    require('./core/passport.js');
}

function initRoutes() {
    app.use('/users', require('./routes/users'));
    app.use('/comments', require('./routes/comments'));
    //app.use(require('./routes/error'));
}

function startServer() {
    var port = process.env.PORT || 3000;
    var server = http.createServer(app);
    server.listen(port, () => console.log('listening http on *:' + port));
}

