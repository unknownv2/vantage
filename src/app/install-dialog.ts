import { DialogController } from 'aurelia-dialog';
import { inject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { remote } from 'electron';

import { EditorManager, EditorInfo, EditorProviderType } from '../editor/editor-manager';
import { showErrorDialog } from '../utility/dialog';

@inject(DialogController, EditorManager, Router)
export class InstallDialog {
	private editorPath: File[] = [];
	private editorUrl: string = '';
	private fetching = false;
	private installing = false;
	private installed = false;
	private editor: EditorInfo;
	private pathSubscription: any;

	constructor(
		private controller: DialogController, 
		private editorManager: EditorManager,
		private router: Router) {

	}

	private activate(editorUrl: string) {
		if (editorUrl) {
			this.fetchEditor(editorUrl);
		}
	}

	private async fetchEditor(editorUrl: string): Promise<void> {
		
		const parts = editorUrl.match(/(^github|npm|disk):(.+)/);

		if (!parts) {
			showErrorDialog('Editor paths must start with github: or npm:');
			return;
		}

		const [url, provider, locator] = parts;

		this.fetching = true;

		try {
			const existing = this.editorManager.editors.find(e => e.provider === provider && e.locator === locator);
			if (existing) {
				this.editor = existing;
				this.installed = true;
			} else {
				this.editor = await this.editorManager.fetchEditorInfo(provider, locator);
				this.installed = this.editorManager.editors.some(e => e.provider === this.editor.provider && e.locator === this.editor.locator);
			}
		} catch (e) {
			showErrorDialog('The editor you want to install could not be found.');
		} finally {
			this.fetching = false;
		}
	}

	private installEditor(provider: EditorProviderType, locator: string): void {
		if (this.installing) {
			return;
		}
		this.installing = true;
		this.editorManager.install(provider, locator).then(e => {
			this.installing = false;
			this.controller.ok();
			this.router.navigateToRoute('editor', {	id: e.id });
		}, () => {
			this.installing = false;
			showErrorDialog('There was a problem installing the editor.');
		})
	}

	private uninstallEditor(editor: EditorInfo): void {
		if (!this.installing) {
			this.editorManager.uninstall(editor);
			this.controller.ok();
		}
	}

	private installLocalEditor(): void {

		const path = this.editorPath[0].path;

		this.fetching = true;
		this.editorManager.fetchEditorInfo('disk', path).then(editor => {
			this.fetching = false;
			this.installEditor('disk', path);
		}, () => {
			showErrorDialog('Editor not found or contains invalid metadata. Check the "vantage" property of package.json.');
			this.fetching = false;
		});
	}

	private close(): void {
		this.controller.ok();
	}

	private openHomepage(editor: EditorInfo): void {
		remote.shell.openExternal(editor.homepage);
	}
}