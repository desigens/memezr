var gulp = require('gulp');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var browserify = require('gulp-browserify');
var rsync = require('gulp-rsync');

gulp.task('default', ['css', 'js', 'js-vendor']);

gulp.task('css', function () {
	return gulp.src('src/stylus/*.styl')
	.pipe(stylus({compress: true}))
	.pipe(gulp.dest('public/css'));
});

gulp.task('js', function () {
	return gulp.src('src/js/app.js')
	.pipe(uglify())
	.pipe(gulp.dest('public/js'));
});

gulp.task('js-vendor', function () {
	return gulp.src('src/js/vendor.js')
	.pipe(browserify())
	.pipe(gulp.dest('public/js'));
});

gulp.task('watch', function () {
	gulp.watch('src/stylus/*.styl', ['css']);
	gulp.watch('src/js/**/*.js', ['js']);
});

gulp.task('deploy', function () {
	return gulp.src('**/*.*')
    .pipe(rsync({
      username: 'root',
      hostname: 'memezr.desigens.com',
      destination: '/var/www/memezr'
    }));
});