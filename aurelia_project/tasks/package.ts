import * as gulp from 'gulp';
import * as svgmin from 'gulp-svgmin';
import * as packager from 'electron-packager';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

gulp.task('copy-dist', () => {
    return gulp.src([
        'index.js',
        'index.html',
        'editor-bridge.js',
        'output/**/*',
        'static/**/*',
    ], {
        base: './',
    })
    .pipe(gulp.dest('dist/'));
});

gulp.task('minify-svg', () => {
    return gulp.src([
        'dist/static/**/*.svg',
    ], {
        base: './',
    })
    .pipe(svgmin())
    .pipe(gulp.dest('./'));
});

const packageApp = callback => {
    const privatePackage = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    console.log('Packaging version ' + privatePackage.version);

    const publicPackage = JSON.parse(fs.readFileSync('./aurelia_project/resources/package.json', 'utf-8'));
    publicPackage.version = privatePackage.version;
    fs.writeFileSync('dist/package.json', JSON.stringify(publicPackage), {encoding: 'utf8'});

    const versionInfo = {
        CompanyName: privatePackage.author,
        FileDescription: privatePackage.description,
        OriginalFilename: '',
        ProductName: privatePackage.productName,
        InternalName: '',
    };

    const config = {
        'arch': 'x64',
        'dir': './dist',
        'platform': 'all',
        'appCopyright': 'Copyright ' + (new Date()).getFullYear() + ' ' + privatePackage.author,
        'appVersion': privatePackage.version,
        'ignore': '^.*\.map$',
        'asar': {
            'unpackDir': './static/unpacked'
        },
        'asar-unpack-dir': 'static/**',
        'buildVersion': privatePackage.version,
        'icon': 'aurelia_project/resources/icon.ico',
        'out': 'packaged',
        'overwrite': true,
        'win32metadata': versionInfo,
    };

    packager(config, callback);
}

export default gulp.series('copy-dist', 'minify-svg', packageApp);
