import { remote } from 'electron';

export function showYesNoDialog(message: string): Promise<boolean> {
    return new Promise(r => {
        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'question',
            message,
            buttons: ['Yes', 'No'],
        }, res => r(res === 0));
    });
}

export function showErrorDialog(message: string): Promise<void> {
    return new Promise<void>(r => {
        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'error',
            message,
        }, res => r());
    });
}

export function showDialog(message: string, options: string[]): Promise<number> {
    return new Promise(r => {
        remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'info',
            message,
            buttons: options,
        }, r);
    });
}