import { readFile, deleteDir } from '../utility/fs';
import { EditorProvider } from './editor-provider';
import { validateUuid } from '../utility/uuid';
import environment from '../environment';
import { remote } from 'electron';
import * as semver from 'semver';

export type EditorProviderType = 'disk'|'github'|string;

export interface EditorInfo {
    id: number;
    official: boolean;
    location: string;
    provider: EditorProviderType;
    locator: string;
    partition: string;

    // package.json:
    version: string;
    homepage: string;
    author: string;
    game: string;
    thumbnailUrl: string;
    name: string;
}

export class EditorManager {
    public editors: EditorInfo[];
    private providers = new Map<string, EditorProvider>();

    constructor() {
        try { this.editors = JSON.parse(localStorage.getItem('editors')); } catch (e) {}
        if (!Array.isArray(this.editors)) {
            this.editors = [];
        }
        this.fixEditorsWithDuplicateIds();
    }

    private fixEditorsWithDuplicateIds(): void {
        let nextId = 1;
        const usedIds = new Set<number>();
        for (const editor of this.editors) {
            while (usedIds.has(editor.id)) {
                editor.id = nextId++;
            }
            usedIds.add(editor.id);
        }
    }

    public parseFullLocator(locator: string): [EditorProviderType, string] {
        const x = locator.indexOf(':');
        return [locator.substr(0, x), locator.substr(x + 1)];
    }

    private persist(): void {
        localStorage.setItem('editors', JSON.stringify(this.editors));
    }

    public registerProvider(id: string, provider: EditorProvider): void {
        this.providers.set(id, provider);
    }

    public findEditor(locator: string): EditorInfo {
        return this.editors.find(e => e.locator === locator);
    }

    public async fetchEditorInfo(providerId: EditorProviderType, locator: string): Promise<EditorInfo> {
        const info = this.readEditorInfo(await this.getProvider(providerId).fetchPackageInfo(locator));
        info.provider = providerId;
        info.locator = locator;
        return info;
    }

    private getProvider(id: EditorProviderType): EditorProvider {
        const provider = this.providers.get(id);
        if (!provider) {
            throw new Error(`Unknown provider ${id}.`)
        }
        return provider;
    }

    public async uninstall(editor: EditorInfo): Promise<void> {
        const index = this.editors.indexOf(editor);
        if (index === -1) {
            return;
        }

        this.editors.splice(index, 1);
        this.persist();

        window.localStorage.removeItem(`editor-history-${editor.id}`)

        try {
            await this.destroyBrowserSession(editor);
        } catch (e) {

        }
        
        if (editor.provider !== 'disk') {
            await deleteDir(editor.location);
        }
    }

    private destroyBrowserSession(editor: EditorInfo): Promise<void> {
        return new Promise<void>((resolve) => {
            remote.session.fromPartition(editor.partition, undefined).clearStorageData(undefined, resolve);
        });
    }

    private nextId(): number {
        return this.editors.reduce((max, e) => e.id >= max ? (e.id + 1) : max, 1);
    }

    public async install(providerId: EditorProviderType, locator: string, official = false, id?: number): Promise<EditorInfo> {
        const existing = this.editors.find(e => e.provider === providerId && e.locator === locator);
        if (existing) {
            return existing;
        }
        const provider = this.getProvider(providerId);
        const location = await provider.fetchEditor(locator);
        const info = await this.readLocalEditorInfo(location);
        info.location = location;
        info.provider = providerId;
        info.locator = locator;
        info.official = official;
        if (!info.homepage) {
            info.homepage = provider.getUrl(locator);
        }
        info.partition = `persist:${providerId}:${locator}`;
        info.id = id || this.nextId();
        this.editors.push(info);
        this.persist();
        return info;
    }

    public async refresh(): Promise<void> {
        const editors = this.editors.slice(0);
        await Promise.all(editors.map(async e => {
            try {
                Object.assign(e, await this.readLocalEditorInfo(e.location));
                if (!e.homepage) {
                    e.homepage = this.getProvider(e.provider).getUrl(e.locator);
                }
                if (!e.id) {
                    e.id = this.nextId();
                }
            } catch (e) {
                if (environment.debug) {
                    console.log(e);
                }
                this.editors.splice(this.editors.indexOf(e), 1);
            }
        }));
        this.persist();
    }

    public async checkForUpdates(): Promise<void> {
        const editors = this.editors.filter(e => e.provider !== 'disk');
        await Promise.all(editors.map(async editor => {
            const provider = this.getProvider(editor.provider);
            let packageInfo: any;
            try {
                packageInfo = await provider.fetchPackageInfo(editor.locator);
            } catch (e) {
                return;
            }
            if (semver.gt(packageInfo.version, editor.version)) {
                await this.uninstall(editor);
                await this.install(editor.provider, editor.locator, editor.official, editor.id);
            }
        }));
    }

    private async readLocalEditorInfo(location: string): Promise<EditorInfo> {
        return this.readEditorInfo(JSON.parse(await readFile(location + '/package.json', 'utf8')));
    }

    private readEditorInfo(packageData: any): EditorInfo {
        if (!packageData.hasOwnProperty('vantage')) {
            throw new Error('Editor metadata not found in package.');
        }
        const info = <EditorInfo>packageData.vantage;
        info.author = info.author || packageData.author || 'Unknown';
        info.version = info.version || packageData.version;
        info.homepage = packageData.homepage;
        this.validateEditorInfo(info);
        delete info.id;
        delete info.location;
        delete info.locator;
        delete info.provider;
        delete info.partition;
        return info;
    }

    private validateEditorInfo(info: EditorInfo): void {
        // Thumbnail
        this.ensureString(info, 'thumbnailUrl')
        if (!info.thumbnailUrl.startsWith('https://') && !info.thumbnailUrl.startsWith('http://')) {
            this.throwValidationError('thumbnailUrl');
        }

        // Homepage
        if (info.homepage) {
            this.ensureString(info, 'homepage');
        }

        // Version
        this.ensureString(info, 'version');
        if (!semver.valid(info.version)) {
            this.throwValidationError('version');
        }

        // Other strings
        this.ensureString(info, 'author');
        this.ensureString(info, 'game');
        this.ensureString(info, 'name');
    }

    private ensureString(obj: any, prop: string): void {
        if (!obj || typeof obj[prop] !== 'string') {
            this.throwValidationError(prop);
        }
    }

    private throwValidationError(prop: string): never {
        throw new Error(`Invalid "${prop}" property in package.`);
    }
}
