import { remote } from 'electron';

const supportUrl = 'https://github.com/unknownv2';

export class Support {
    private disabled = false;

    public visit(): void {
        if (!this.disabled) {
            this.disabled = true;
            remote.shell.openExternal(supportUrl);
            setTimeout(() => this.disabled = false, 1000);
        }
    }
}
