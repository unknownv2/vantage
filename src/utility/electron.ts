import { remote, ipcRenderer } from 'electron';

ipcRenderer.removeAllListeners('argv');
ipcRenderer.addListener('argv', onArgv);

let uriHandler: (uri: string) => void;

export function registerUriHandler(handler: (uri: string) => void): void {
    uriHandler = handler;
}

export function getLaunchUri(): string {
    return parseArgvUri(remote.process.argv);
}

function onArgv(event, argv: string[]): void {
    if (remote.getCurrentWindow().isMinimized()) {
        remote.getCurrentWindow().restore();
    }
    remote.getCurrentWindow().focus();

    const uri = parseArgvUri(argv);
    if (uri && uriHandler) {
        uriHandler(uri);
    }
}

function parseArgvUri(argv: string[]): string {
    return argv.length <= 1 || argv[1].indexOf('://') === -1 ? null : argv[1].trim();
}