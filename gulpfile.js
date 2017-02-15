var gulp = require('gulp');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var rename = require("gulp-rename");
var concat = require("gulp-concat");

gulp.task('styles', function() {
	gulp
		.src([
			'./resources/sass/app.scss',
		])
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(gulp.dest('./public/assets/css/'));
});

gulp.task('scripts', function() {
	return gulp.src([
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/vue/dist/vue.min.js',
		'./resources/js/soundjs-0.6.2.min.js',
		'./resources/js/app.js',
	])
	.pipe(concat('app.js'))
	.pipe(gulp.dest('./public/assets/js/'));
});

// Watch task
gulp.task('default',function() {
	gulp.watch(['resources/sass/**/*.scss'],['styles']);
    gulp.watch(['resources/js/**/*.js'],['scripts']);
});
