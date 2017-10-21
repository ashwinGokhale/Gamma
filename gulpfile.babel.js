import gulp from 'gulp';
import babel from 'gulp-babel';
import gutil from 'gulp-util';

gulp.task('default', ['babel','watch']);
gulp.task('babel', () => {
	return gulp.src('src/*.js')
 	.pipe(babel({
		comments: false,
		compact: true,
		presets: ['es2015']
	}))
	.on('error', function (err) { 
		gutil.log(gutil.colors.red('[Error]'), err.toString()); 
		this.emit('end');
	})
  	.pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
  return gulp.watch(['src/**'], ['babel']);
});