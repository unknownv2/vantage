import { promisifyAll } from './async';
import { remote } from 'electron';
import { Stats } from "fs";
import * as fsSync from 'fs';
import * as https from 'https';
import * as url from 'url';
import * as path from 'path';

const fs = <any>promisifyAll(fsSync);

async function getTypeInDirectory(dir: string, type: 'Directory'|'File'): Promise<string[]> {
    const files = [];
    await Promise.all((await fs.readdirAsync(dir)).map(async d => {
        if ((await fs.statAsync(`${dir}/${d}`))[`is${type}`]()) {
            files.push(d);
        }
    }));
    return files;
}

export function getFilesInDirectory(dir: string): Promise<string[]> {
    return getTypeInDirectory(dir, 'File');
}

export function getSubdirectories(dir: string): Promise<string[]> {
    return getTypeInDirectory(dir, 'Directory');
}

export function stat(file: string): Promise<Stats> {
    return fs.statAsync(file);
}

export function unlink(file: string): Promise<void> {
    return fs.unlinkAsync(file);
}

export async function makeDir(dir: string): Promise<string> {
    let stats: Stats;
    try {
        stats = await stat(dir);
        if (stats.isDirectory) {
            return dir;
        }
    } catch (e) {
        await makeDir(path.dirname(dir));
    }
    if (stats && stats.isFile) {
        // Traverse down to avoid permission issues.
        throw new Error('Path exists as file.');
    }
    await fs.mkdirAsync(dir);
    return dir;
}

async function deleteDirRecursive(dir: string): Promise<void> {
    const files = await fs.readdirAsync(dir);
    for (const file of files) {
        const filename = path.join(dir, file);
        const stats = await stat(filename);
        if (stats.isDirectory()) {
            await deleteDirRecursive(filename);
        } else {
            await unlink(filename);
        }
    }
    await fs.rmdirAsync(dir);
}

export async function deleteDir(dir: string): Promise<void> {
    let stats: Stats;
    try {
        stats = await stat(dir);
    } catch (e) {
        return;
    }
    if (stats.isDirectory) {
        await deleteDirRecursive(dir);
    } else {
        await unlink(dir);
    }
}

export function readFile(file: string, encoding?: string): Promise<Buffer&string> {
    return fs.readFileAsync(file, encoding);
}

export function writeFile(file: string, data: any, options?: { encoding?: string; mode?: string; flag?: string; }): Promise<void> {
    return fs.writeFileAsync(file, data, options);
}

export function openFileDialog(options: Electron.OpenDialogOptions): Promise<string[]> {
    return new Promise(r => remote.dialog.showOpenDialog(remote.getCurrentWindow(), options, r));
}

export function saveFileDialog(options: Electron.SaveDialogOptions): Promise<string> {
    return new Promise(r => remote.dialog.showSaveDialog(remote.getCurrentWindow(), options, r));
}

export function downloadFile(httpsUrl: string, dest: string|any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const file = typeof dest === 'string' ? fs.createWriteStream(dest) : dest;
        const parsedUrl = url.parse(httpsUrl);
        https.get({
            protocol: parsedUrl.protocol,
            host: parsedUrl.host,
            path: parsedUrl.path,
            headers: {
                'User-Agent': 'Vantage',
            },
        }, async response => {
            if (response.statusCode === 302) {
                try {
                    resolve(await downloadFile(response.headers['location'], file));
                } catch (e) {
                    reject(e);
                }
                return;
            }
            if (response.statusCode !== 200) {
                reject(response);
                response.destroy();
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', e => {
            fs.unlink(dest);
            reject(e);
        });
    });
};
