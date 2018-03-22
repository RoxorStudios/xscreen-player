var gulp = require('gulp');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var rename = require("gulp-rename");
var concat = require("gulp-concat");

gulp.task('styles-player', function() {
	gulp
		.src([
			'./resources/sass/app.scss',
		])
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(gulp.dest('./public/assets/css/'));
});
gulp.task('styles-live', function() {
	gulp
		.src([
			'./resources/sass/live.scss',
		])
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(gulp.dest('./public/assets/css/'));
});

gulp.task('scripts-player', function() {
	return gulp.src([
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/vue/dist/vue.min.js',
		'./resources/js/plugins/soundjs-0.6.2.min.js',
		'./resources/js/app.js',
	])
	.pipe(concat('app.js'))
	.pipe(gulp.dest('./public/assets/js/'));
});

gulp.task('scripts-live', function() {
	return gulp.src([
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/vue/dist/vue.min.js',
		'./resources/js/plugins/jstween-1.1.min.js',
		'./resources/js/live.js',
	])
	.pipe(concat('live.js'))
	.pipe(gulp.dest('./public/assets/js/'));
});

// Watch task
gulp.task('default',function() {
	gulp.watch(['resources/sass/**/*.scss'],['styles-player','styles-live']);
    gulp.watch(['resources/js/**/*.js'],['scripts-player','scripts-live']);
});
