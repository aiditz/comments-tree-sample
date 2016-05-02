'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var less = require('gulp-less');
var path = require('path');
var concat = require('gulp-concat');

gulp.task('default', ['start']);

gulp.task('compile', ['sma2', 'javascript', 'less']);
gulp.task('start', ['compile', 'run']);
gulp.task('debug', ['compile', 'run-debug']);

gulp.task('less', function () {
	return gulp.src('./static/css/**/*.less')
		.pipe(less())
		.pipe(concat('bundle.css'))
		.pipe(gulp.dest('./static/compiled'));
});

gulp.task('javascript', function () {
	// set up the browserify instance on a task basis
	var b = browserify({
		entries: './static/js/game/index.js',
		debug: true
	});

	return b.bundle()
		.pipe(source('bundle-game.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		// Add transformation tasks to the pipeline here.
		//.pipe(uglify())
		.on('error', gutil.log)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./static/compiled/'));
});

gulp.task('run', shell.task([
	'node app-worker'
], {
	verbose: true
}));

gulp.task('run-debug', shell.task([
	'node --debug --max-old-space-size=3072 app-worker'
], {
	verbose: true
}));

gulp.task('deploy', shell.task([
	'git push origin master',
	'deploy production'
], {
	verbose: true
}));

gulp.task('watch', function () {
	gulp.watch(['./lib/sma2/js/**/*.js'], ['sma2']);
	gulp.watch(['./static/js/**/*.js'], ['javascript']);
	gulp.watch(['./static/css/**/*'], ['less']);
});

require('./lib/sma2/nodejs/gulp-include')(gulp, './static/compiled/');