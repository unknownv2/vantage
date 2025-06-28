import { promisify } from '../../utility/async';
import { downloadFile, makeDir, unlink, deleteDir } from '../../utility/fs';
import { EditorInfo } from '../editor-manager';
import { EditorProvider } from '../editor-provider';
import { HttpClient } from 'aurelia-fetch-client';
import * as yauzl from 'yauzl';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

let counter = 0;

export class GitHubEditorProvider implements EditorProvider {
    private http: HttpClient;

    constructor(private cacheDir: string) {
        this.http = new HttpClient().configure(config => {
            config
                .rejectErrorResponses()
                .withBaseUrl('https://api.github.com')
                .withDefaults({
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                    },
                });
        });
    }

    public checkFormat(location: string): boolean {
        return /[a-z0-9_\-]+\/[a-z0-9_\-]+#?[a-z0-9_\-]+/.test(location);
    }

    public async fetchPackageInfo(locator: string): Promise<any> {
        const loc = this.getRepoAndTag(locator);
        if (!loc.tag) {
            loc.tag = (await this.getRelease(locator)).tag_name;
        }
        return JSON.parse(atob((await this.get(`/repos/${loc.repo}/contents/package.json?ref=${encodeURIComponent(loc.tag)}`)).content));
    }

    public async fetchEditor(locator: string): Promise<string> {
        const location = path.join(this.cacheDir, locator);
        const [release]: any[] = await Promise.all([
            this.getRelease(locator), 
            deleteDir(location),
        ]);
        const filename = this.getTempDownloadPath();
        await downloadFile(release.zipball_url, filename);
        try {
            return await new Promise<string>(async (resolve, reject) => {
                const zip = await promisify(yauzl.open)(filename, {lazyEntries: true});
                const openReadStream = promisify(zip.openReadStream.bind(zip));
                zip.readEntry();
                zip.on('entry', async entry => {
                    if (entry.fileName.endsWith('/')) {
                        zip.readEntry();
                    } else {
                        const filename = path.join(location, entry.fileName.substr(entry.fileName.indexOf('/') + 1));
                        await makeDir(path.dirname(filename));
                        const stream = await openReadStream(entry);
                        stream.on('end', () => zip.readEntry());
                        stream.pipe(fs.createWriteStream(filename));
                    }
                });
                zip.on('end', () => resolve(location));
            });
        } catch (e) {
            await deleteDir(location);
            throw e;
        } finally {
            unlink(filename);
        }
    }

    private getRelease(locator: string): Promise<any> {
        const loc = this.getRepoAndTag(locator);
        const endpoint = `/repos/${loc.repo}/releases/` + (loc.tag ? `tags/${loc.tag}` : 'latest');
        return this.get(endpoint);
    }

    public getUrl(locator: string): string {
        const loc = this.getRepoAndTag(locator);
        return 'https://github.com/' + loc.repo;
    }

    private getRepoAndTag(locator: string): {repo: string; tag?: string;} {
        const parts = locator.split('#');
        return {
            repo: parts[0],
            tag: parts[1] || undefined,
        };
    }

    private getTempDownloadPath(): string {
        return path.join(os.tmpdir(), `vantage-editor-${Date.now()}-${counter++}.zip`);
    }

    private async get(endpoint: string): Promise<any> {
        return await (await this.http.fetch(endpoint)).json();
    }
}
