import { remote } from 'electron';

const patreonUrl = 'https://www.patreon.com/unknownv2';

export class Donation {
    private disabled = false;

    public visit(): void {
        if (!this.disabled) {
            this.disabled = true;
            remote.shell.openExternal(patreonUrl);
            setTimeout(() => this.disabled = false, 1000);
        }
    }
}