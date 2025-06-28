import { CLIOptions } from 'aurelia-cli';
import build from './build';
import watch from './watch';
import * as childProcess from 'child_process';
import * as electron from 'electron';
import * as gulp from 'gulp';

const watching = CLIOptions.hasFlag('watch');

const args = ['.'];

if (watching) {
    args.push('--electron-reload');
}

const serve = done => {
    childProcess
        .spawn(electron, args, {
            stdio: 'inherit'
        })
        .on("close", () => {
            // User closed the app. Kill the host process.
            process.exit();
        })

    done();
};

export default watching 
    ? gulp.series(build, serve, watch) 
    : serve;