'use strict';

var config = require('./config');
var http = require('http');
var express = require('express');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');

var app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
//app.use(cookieParser(config.sessionSecret));
//app.use(passport.initialize());

mongoose.connect(config.mongoose.url);

app.set('json spaces', 4);
app.use('/login', require('./routes/login'));
app.use('/users', require('./routes/users'));
app.use('/comments', require('./routes/comments'));
app.use(require('./routes/error'));

startServer();

function startServer() {
	var port = process.env.PORT || 3000;
	var server = http.createServer(app);
	server.listen(port, () => console.log('listening http on *:' + port));
}

