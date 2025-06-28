import { inject } from 'aurelia-framework';
import { remote, ipcRenderer } from 'electron';

export class WindowControlsCustomElement {
	public minimized: boolean;
	public maximized: boolean;

	constructor() {
		this.addIpcListener('main-window-state', () => this.refresh());
		this.refresh();
	}

	private addIpcListener(event: string, handler: Function): void {
        ipcRenderer.removeAllListeners(event);
        ipcRenderer.addListener(event, handler);
    }

    private refresh(): void {
        const window = remote.getCurrentWindow();
        this.minimized = window.isMinimized();
        this.maximized = window.isMaximized();
    }

	public minimize(): void {
		remote.getCurrentWindow().minimize();
	}

	public maximize(): void {
		remote.getCurrentWindow().maximize();
	}

	public restore(): void {
		remote.getCurrentWindow().unmaximize();
	}

	public close(): void {
		remote.getCurrentWindow().close();
	}
}
