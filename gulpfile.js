// config
var config = {
    // folders
    dist:       'dist',
    src:        'src',

    // directory
    bower_dir:      'src/bower_components',
    plugins_dir:    'plugins',
    vendor_dir:     'vendor',

    // files
    files : {
        css : {
            main : ['%src%/less/main.less']
        },
        js : {
            plugins : [],
            main : ['%src%/js/main.js']
        },
        js_folders : {
            "components" : "*",
            "shared" : "*"
        },
        fonts : [
            '%bower_dir%/bootstrap/fonts/*',
            '%bower_dir%/font-awesome/fonts/*'
        ],
        img : [
            '%src%/img/**/*'
        ],
        copy : {
            'img' : [
                '%src%/img/'
            ]
        }
    },

    // copy
    plugins: {
        fonts: [
            '%bower_dir%/bootstrap/fonts/*',
            '%bower_dir%/font-awesome/fonts/*'
        ],
        copy: {
            'html5shiv': [
                '%bower_dir%/html5shiv/dist'
            ]
        }
    },

    // livereload
    livereload: ['./dist/css/*.css']
};
// end config



// ------ load modules
var _               = require('lodash')
    browserify      = require('gulp-browserify')
    concat          = require('gulp-concat')
    connect         = require('gulp-connect')
    expect          = require('gulp-expect-file')
    fs              = require('fs');
    gulp            = require('gulp')
    gulpif          = require('gulp-if')
    gutil           = require('gulp-util');
    imagemin        = require('gulp-imagemin')
    include         = require('gulp-include')
    less            = require('gulp-less')
    notify          = require('gulp-notify')
    rename          = require('gulp-rename')
    size            = require('gulp-filesize')
    sourcemaps      = require('gulp-sourcemaps')
    watch           = require('gulp-watch')
    uglify          = require('gulp-uglify');
// end load modules



// ------- tasks
gulp.task('css', handleCSS);
gulp.task('js', handleJS);
gulp.task('copy', handleCopy);
gulp.task('img', handleImg);

gulp.task('server', function () {

    connect.server({
        root:           '.',
        livereload:     true
    });

});

gulp.task('watch', function(){

    // launch server
    gulp.start('server');


    // js
    gulp.watch([
        config.src + '/js/*.js',
        config.src + '/js/**/*.js'
    ], ['js']);


    // css
    gulp.watch([
        config.src + '/less/*.less',
        config.src + '/less/**/*.less'
    ], ['css']);


    // gulpfiles
    gulp.watch(['./gulpfile.js'], ['dev']);


    // watch
    gulp.watch(config.livereload)
        .on('change', function (file) {
            gulp.src(file.path)
                .pipe(connect.reload())
                .pipe(notify(' <( Reload! ) '));

            // log
            gutil.log(gutil.colors.inverse(' <( Reload! ) '));
        });

    gutil.log(gutil.colors.inverse(' ( Ready to work! )> '));

});

// dev: Same when watch. (Without image copy and imagemin)
gulp.task('dev', function () {
    gulp.start('css', 'js', 'copy');

    gulp.src('./').pipe(notify(' <( Dev build complete! ) '));
    gutil.log(gutil.colors.inverse(' <( Dev build complete! ) '));
});

// build: All with image copy and imagemin
gulp.task('build', function () {
    gulp.start('css', 'js', 'copy', 'img');

    gulp.src('./').pipe(notify(' <( Build complete! ) '));
    gutil.log(gutil.colors.inverse(' <( Build complete! ) '));
});
// end tasks



// ------ functions
function handleCSS() {

    _.forEach(config.files.css, function(items, name) {

        gulp.src(config.src + '/less/'+name+'.less')
            .pipe(sourcemaps.init())
            .pipe(less().on('error', gutil.log))
            .pipe(size())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(config.dist + '/css'));

    });
}


function handleJS() {

    _.forEach(config.files.js, function(items, name) {

        items = smrtr(items, config);

        for (var i = 0; i < items.length; i++) {
            items[ i ] = items[ i ].replace('%src%', config.src)
        }

        // concat
        gulp.src(items)
            .pipe(expect(items))
            .pipe(include())
            .pipe(concat( name + '.js'))
            .pipe(gulp.dest(config.dist + '/js/'))
            .on('error', swallowErrors);

        // minify
        gulp.src(config.dist + '/js/'+name+'.js')
            .pipe(uglify({mangle:false}))
            .pipe(rename(name+'.min.js'))
            .pipe(gulp.dest(config.dist + '/js/'));
    });

}


function handleImg(){
    _.forEach(config.files.img, function (path, key) {
        config.files.img[key] = smrtr(path, config);
    });

    gulp.src(config.files.img)
        .pipe(gulp.dest(config.dist + '/img'));
}


function handleCopy() {
    var file = '';

    // Copy main_files fonts inside dist/fonts
    for (var i = 0, len = config.files.fonts.length; i < len; i++) {
        file = config.files.fonts[i].replace('%bower_dir%', config.bower_dir).replace('%src%', config.src);
        gulp.src(file)
            .pipe(gulp.dest(config.dist + '/fonts'));
    }

    // Copy extra folders
    _.forEach(config.files.copy, function(items, name) {
        if (Object.prototype.toString.call(config.files.copy[name]) !== '[object Array]') {
            config.files.copy[name] = [config.files.copy[name]];
        }

        for (var i = 0, len = config.files.copy[name].length; i < len; i++) {
            file = smrtr(config.files.copy[name][i], config).replace('%src%', config.src);

            if (fs.lstatSync(file).isDirectory()) {
                gulp.src(file + '/**/*', {base: file})
                    .pipe(gulp.dest(config.dist + '/' + name));
            } else {
                gulp.src(file)
                    .pipe(gulp.dest(config.dist + '/' + name));
            }
        }
    });

    // Copy Plugins to public_dir/plugins
    for (var plugin in config.plugins.copy) {
        if (Object.prototype.toString.call(config.plugins.copy[plugin]) !== '[object Array]') {
            config.plugins.copy[plugin] = [config.plugins.copy[plugin]];
        }

        for (var i = 0, len = config.plugins.copy[plugin].length; i < len; i++) {
            file = smrtr(config.plugins.copy[plugin][i], config).replace('%src%', config.src).replace('%bower_dir%', config.bower_dir);

            if (fs.lstatSync(file).isDirectory()) {
                gulp.src(file + '/**/*', {base: file})
                    .pipe(gulp.dest(config.dist + '/plugins/' + plugin));
            } else {
                gulp.src(file)
                    .pipe(gulp.dest(config.dist + '/plugins/' + plugin));
            }
        }
    }

}



// ------- helpers
function smrtr(arr, data) {

    // Little method to apply dynamic variables

    if (typeof arr === 'string') {
        return _.template(arr)(data);
    }

    return _.map(arr, function (item) {
        return smrtr(item, data);
    });
}


function swallowErrors(error) {

    // Little method to output better errors

    var message = '';

    if (error && error.toString()) {
        message = error.toString();
    }

    gutil.log(gutil.colors.red('✖', message));

    gulp.src('./').pipe(notify('✖ Error'));

    this.emit('end');
}
// end functions