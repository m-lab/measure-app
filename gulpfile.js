var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var inject = require('gulp-inject');
var gettext = require('gulp-angular-gettext');

gulp.task('default', ['app']);

gulp.task('app', ['build'], function() {
  var APP_MANIFEST_JSON = 'resources/manifest.app.json';
  console.info("Copying manifest from", APP_MANIFEST_JSON);
  gulp.src(APP_MANIFEST_JSON)
    .pipe(rename('manifest.json'))
    .pipe(gulp.dest('www'));
});

gulp.task('extension', ['build'], function() {
  var EXTENSION_MANIFEST_JSON = 'resources/manifest.extension.json';
  console.info("Copying manifest from", EXTENSION_MANIFEST_JSON);
  gulp.src(EXTENSION_MANIFEST_JSON)
    .pipe(rename('manifest.json'))
    .pipe(gulp.dest('www'));
});

gulp.task('build', ['sass', 'inject'], function() {});

gulp.task('inject', ['translations'], function() {
  gulp.src('www/index.html')
  .pipe(inject(gulp.src('www/translations/scripts/*.js', {read: false}), {relative: true, name: 'translations'}))
  .pipe(gulp.dest('www'));
});

gulp.task('translations', ['pot'], function () {
  return gulp.src('www/translations/lang/*.po')
  .pipe(gettext.compile())
  .pipe(gulp.dest('www/translations/scripts/'));
});

gulp.task('pot', function () {
  return gulp.src([
    'www/templates/*.html',
    'www/templates/modals/*.html',
    'www/templates/static/*.html',
    'www/js/app.js',
  ])
  .pipe(gettext.extract('application.pot', {
    // options to pass to angular-gettext-tools...
  }))
  .pipe(gulp.dest('www/translations/source'));
});

gulp.task('sass', function(done) {
  gulp.src('./scss/*.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(cssnano())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(['./scss/**/*.scss'], ['sass']);
});
