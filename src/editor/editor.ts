import { openFileDialog, readFile, writeFile, stat } from '../utility/fs';
import { showErrorDialog, showDialog, showYesNoDialog } from '../utility/dialog';
import { EditorManager, EditorInfo } from './editor-manager';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, computedFrom } from 'aurelia-framework';
import { InstallDialog } from '../app/install-dialog';
import { IDisposable } from '../utility/disposable';
import { DialogService } from 'aurelia-dialog';
import { portInUse } from './development';
import environment from '../environment';
import { Router } from 'aurelia-router';
import { remote } from 'electron';
import * as path from 'path';

const loadTimeout = 10 * 1000;

type EditorStatus = 'loading'|'saving';

interface LocalFile {
    path: string;
    name: string;
    size: number;
    lastUsed: number;
}

@inject(EditorManager, DialogService, Router, EventAggregator)
export class Editor {
    public editorInfo: EditorInfo;
    public editorLocation: string;
    public editorLoaded = false;
    public editorInitialized = false;
    private localDevMode = false;
    private frame: Electron.WebviewTag;
    public status: EditorStatus;

    public fileSelectorOpen = false;
    public selectedFile: LocalFile;
    public localFiles: LocalFile[] = [];

    private statusResolve: Function;
    private statusReject: Function;

    constructor(
        private editorManager: EditorManager,
        private dialogService: DialogService,
        private router: Router,
        private ea: EventAggregator) {
    }

    private persistLocalHistory(): void {
        localStorage.setItem(
            `editor-history-${this.editorInfo.id}`, 
            JSON.stringify(this.localFiles));
    }

    public attached(): void {
        this.frame.addEventListener('ipc-message', (e: Electron.IpcMessageEvent) => {
            if (e.channel === 'editor') {
                this.handleEditorMessage(e.args.shift(), e.args);
            }
        });

        this.frame.addEventListener('dom-ready', () => {
            this.editorInitialized = false;
            this.selectedFile = null;
            this.disableEditor();
            if (this.editorInfo.provider === 'disk') {
                this.frame.getWebContents().openDevTools();
            }
        });
    }

    public async activate(params: any): Promise<void> {
        this.editorInfo = this.editorManager.editors.find(e => e.id == params.id);

        this.loadLocalHistory();

        this.localDevMode = this.editorInfo.provider === 'disk' && await portInUse(9050);
        if (this.localDevMode) {
            this.editorLocation = 'http://127.0.0.1:9050';
        } else {
            this.editorLocation = this.editorInfo.location.replace('#', '%23');
        }
    }

    private loadLocalHistory(): void {
        try {
            const localFiles = JSON.parse(window.localStorage.getItem(`editor-history-${this.editorInfo.id}`));
            this.localFiles = localFiles.slice(0);
            localFiles.forEach(async (file: LocalFile) => {
                const updatedFile = await this.getLocalFile(file.path, file.lastUsed);
                if (updatedFile) {
                    Object.assign(file, updatedFile);
                } else {
                    const x = this.localFiles.indexOf(file);
                    if (x !== -1) {
                        this.localFiles.splice(x, 1);
                    }
                }
            });
        } catch (e) {
            this.localFiles = [];
        }
    }

    private handleEditorMessage(type: string, args: any[]): void {
        if (type === 'initialized') {
            this.editorInitialized = true;
            return;
        }

        if (type === 'dev-tools') {
            this.frame.getWebContents().openDevTools();
            return;
        }

        if (!this.statusResolve || !this.statusReject) {
            return;
        }
        
        if (type === 'loaded' && this.status === 'loading') {
            if (args[0]) {
                this.statusReject(args[0]);
            } else {
                this.statusResolve(true);
            }
            this.statusResolve = null;
            this.statusReject = null;
        } else if (type === 'saved' && this.status === 'saving') {
            if (args[0] || !(args[1] instanceof Uint8Array)) {
                this.statusReject(args[0]);
            } else {
                this.statusResolve(Buffer.from(args[1]));
            }
            this.statusResolve = null;
            this.statusReject = null;
        }
    }

    public toggleFileSelector(): void {
        this.fileSelectorOpen = !this.fileSelectorOpen;
    }

    public async openLocalFile(): Promise<void> {
        const files = await openFileDialog({});
        if (files && files[0]) {
            const file = await this.getLocalFile(files[0], Date.now());
            if (file) {
                await this.loadLocalSave(file);
            }  
        }
    }

    private async getLocalFile(filePath: string, lastUsed: number): Promise<LocalFile> {
        try {
            const stats = await stat(filePath);
            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                lastUsed,
            };
        } catch (e) {
            return null;
        }
    }

    public async loadLocalSave(file: LocalFile): Promise<void> {
        await this.load(file, () => readFile(file.path));
        this.localFiles = this.localFiles.filter(f => f.path !== file.path);
        file.lastUsed = Date.now();
        this.localFiles.push(file);
        this.persistLocalHistory();
    }

    public async load(file: LocalFile, func: () => Promise<Buffer>): Promise<void> {
        this.fileSelectorOpen = false;
        if (this.editorLoaded && this.selectedFile === file) {
            return;
        }
        this.disableEditor();
        this.selectedFile = file;
        try {
            await this.executeWithStatus(async () => {
                if (await this.loadSaveIntoEditor(await func())) {
                    this.enableEditor();
                } else {
                    this.selectedFile = null;
                }
            }, 'loading');
        } catch (e) {
            this.selectedFile = null;
            alert('An error occurred while loading your save.');
            throw e;
        }
    }

    private loadSaveIntoEditor(data: Buffer): Promise<boolean> {
        const promise = new Promise<boolean>((resolve, reject) => {
            const wrap = func => {
                return result => {
                    clearTimeout(timeout);
                    func(result);
                };
            };
            this.statusResolve = wrap(resolve);
            this.statusReject = wrap(reject);
        });

        let timeout;
        if (!this.localDevMode) {
            const showTimeoutDialog = async () => {
                const result = await showYesNoDialog('The saved game is taking a while to load. Do you want to cancel?');
                if (result && this.statusReject) {
                    this.statusResolve(false);
                } else if (!result) {
                    timeout = setTimeout(showTimeoutDialog, loadTimeout);
                }
            }; 
            timeout = setTimeout(showTimeoutDialog, loadTimeout);
        }
        
        this.frame.send('editor', 'load', data);
        return promise;
    }

    public async save(): Promise<void> {
        if (!this.editorLoaded) {
            return;
        }

        if (!this.selectedFile) {
            return;
        }

        this.disableEditor();

        try {
            await this.saveLocalSave(<LocalFile>this.selectedFile);
        } finally {
            this.enableEditor();
        }
    }

    private async saveLocalSave(file: LocalFile): Promise<void> {
        let buffer: Buffer;
        try {
            buffer = await this.executeWithStatus(this.getBufferFromEditor(), 'saving');
        } catch (e) {
            showErrorDialog('An error occurred while saving your data.');
        }
        try {
            await this.executeWithStatus(writeFile(file.path, buffer), 'saving');
        } catch (e) {
            alert('An error occurred while saving your file.');
            throw e;
        }
    }

    private getBufferFromEditor(): Promise<any> {
        const promise = new Promise((resolve, reject) => {
            this.statusResolve = resolve;
            this.statusReject = reject;
        });
        this.frame.send('editor', 'save');
        return promise;
    }

    private async executeWithStatus(func: (() => any)|Promise<any>, status: EditorStatus): Promise<any> {
        if (this.status) {
            return false;
        }
        this.status = status;
        try {
            if (func instanceof Promise) {
                return await func;
            } else {
                return await func();
            }
        } finally {
            this.forceClearStatus();
        }
    }

    private forceClearStatus(): void {
        this.statusResolve = null;
        this.statusReject = null;
        this.status = null;
    }

    private enableEditor(): void {
        if (this.frame) {
            this.editorLoaded = true;
            this.frame.executeJavaScript('document.body.classList.remove("disabled")', false);
        }
    }

    private disableEditor(): void {
        this.editorLoaded = false;
        if (this.frame) {
            this.frame.executeJavaScript('document.body.classList.add("disabled")', false);
        }
    }

    public editorFocused(event: Event): void {
        this.ea.publish('editor-focused', event);
    }

    public async manage(): Promise<void> {
        await new Promise((resolve, reject) => {
            this.dialogService.open({
                viewModel: InstallDialog,
                model: `${this.editorInfo.provider}:${this.editorInfo.locator}`,
            }).whenClosed(resolve, reject);
        });
        if (!this.editorManager.editors.includes(this.editorInfo)) {
            this.router.navigateToRoute('default');
        }
    }

    private clearLocalSaves(): void {
        this.disableEditor();
        this.selectedFile = null;
        this.localFiles = [];
        this.persistLocalHistory();
    }

    private removeLocalSave(file: LocalFile, e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();

        if (this.selectedFile === file) {
            this.disableEditor();
            this.selectedFile = null;
        }
        
        this.localFiles.splice(this.localFiles.indexOf(file), 1);
        this.persistLocalHistory();
    }
}
