import * as electronInstaller from 'electron-winstaller';
import * as gulp from 'gulp';
import * as path from 'path';
import * as asar from 'asar';
import * as fs from 'fs';

const privatePackage = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const appDirectory = `packaged/${privatePackage.productName}-win32-x64`;

// Squirrel uses nuget versioning, which doesn't support
// pre-release components. Therefore, we have to pad the
// revision number to account for lexicographical sorting.
function getNugetVersionNumber(): string {
    let version = <string>JSON.parse(asar.extractFile(path.join(appDirectory, 'resources', 'app.asar'), 'package.json')).version;
    const versionParts = version.split('-');
    if (versionParts.length === 2) {
        const preReleaseParts = versionParts[1].split('.');
        if (preReleaseParts.length === 2) {
            if (preReleaseParts[1].length === 1) {
                preReleaseParts[1] = '0' + preReleaseParts[1];
                version = versionParts[0] + '-' + preReleaseParts.join('');
            }
        }
    }
    return version;
}

const config = {
    appDirectory,
    outputDirectory: 'installer',
    version: getNugetVersionNumber(),
    authors: privatePackage.author,
    setupExe: `${privatePackage.productName}-Setup.exe`,
    setupIcon: 'aurelia_project/resources/icon.ico',
    iconUrl: 'https://raw.githubusercontent.com/vantagemods/resources/master/logo.ico',
    loadingGif: 'aurelia_project/resources/logo.gif',
    noMsi: true,
    remoteReleases: undefined,
    signWithParams: undefined,
};

export default callback => {
    return electronInstaller.createWindowsInstaller(config).then(callback);
};
