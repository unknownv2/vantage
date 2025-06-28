import { deleteDir, makeDir, unlink } from '../../utility/fs';
import { EditorProvider } from "../editor-provider";
import { HttpClient } from 'aurelia-fetch-client';
import { promisify } from '../../utility/async';
import * as tarball from 'tarball-extract';
import * as semver from 'semver';
import * as path from 'path';
import * as os from 'os';

interface PackageId {
    org?: string;
    name: string;
    version?: string;
}

let counter = 0;

export class NpmEditorProvider implements EditorProvider {
    private http: HttpClient;

    constructor(private cacheDir: string) {
        this.http = new HttpClient().configure(config => {
            config
                .rejectErrorResponses()
                .withBaseUrl('https://registry.npmjs.org')
                .withDefaults({
                    headers: {
                        'Accept': 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
                    },
                });
        });
    }

    public async fetchEditor(locator: string): Promise<string> {
        const location = path.join(this.cacheDir, locator);
        const [packageInfo]: any[] = await Promise.all([
            this.fetchPackageInfo(locator), 
            deleteDir(location),
        ]);
        await makeDir(location);
        const filename = this.getTempDownloadPath();
        try {
            await promisify(tarball.extractTarballDownload)(packageInfo.dist.tarball, filename, location, {});
        } catch (e) {
            await deleteDir(location);
            throw e;
        } finally {
            unlink(filename);
        }
        return path.join(location, 'package');
    }

    public async fetchPackageInfo(locator: string): Promise<any> {
        const info = await this.get(this.getPackageUrl(this.parseLocator(locator)));
        info.author = info.author.name;
        return info;
    }

    private getPackageUrl(id: PackageId): string {
        const name = encodeURIComponent((id.org ? `@${id.org}/` : '') + id.name);
        return `/${name}/${encodeURIComponent(id.version || 'latest')}`
    }

    private parseLocator(locator: string): PackageId {
        let org: string;
        if (locator.startsWith('@')) {
            const parts = locator.split('/');
            if (parts.length !== 2) {
                this.throwPackageNameError();
            }
            org = parts[0];
            locator = parts[1];
            if (!org || !/^[-_a-z0-9]+$/.test(org)) {
                this.throwPackageNameError();
            }
        }
        let version: string;
        const parts = locator.split('@');
        if (parts.length === 2) {
            version = parts[1];
            if (!semver.valid(version)) {
                this.throwPackageNameError();
            }
        } else if (parts.length > 2) {
            this.throwPackageNameError();
        }
        const name = parts[0];
        if (!name || !/^[-_a-z0-9]+$/.test(name)) {
            this.throwPackageNameError();
        }
        return { org, name, version };
    }

    public getUrl(locator: string): string {
        const loc = this.parseLocator(locator);
        return 'https://npmjs.com/packages/' + (loc.org ? `@${loc.org}/` : '') + loc.name;
    }

    private async get(endpoint: string): Promise<any> {
        return await (await this.http.fetch(endpoint)).json();
    }

    private throwPackageNameError(): never {
        throw new Error('Invalid npm package name.');
    }

    private getTempDownloadPath(): string {
        return path.join(os.tmpdir(), `vantage-editor-${Date.now()}-${counter++}.tar.gz`);
    }
}
