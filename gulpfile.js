'use strict';

var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')();


// Build
gulp.task('lint', function () {
    return gulp.src('*.js')
        .pipe($.jshint('.jshintrc'))
        .pipe($.jshint.reporter('default'));
});

// Default task
gulp.task('default', function () {
    gulp.start('lint');
});
