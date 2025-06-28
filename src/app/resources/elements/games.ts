import { EditorManager } from '../../../editor/editor-manager';
import { Router } from 'aurelia-router';
import { inject } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { InstallDialog } from '../../install-dialog';

@inject(Router, EditorManager, DialogService)
export class GamesCustomElement {
    constructor(private router: Router, private editorManager: EditorManager, private dialog: DialogService) {
        
    }

    private async addGame(): Promise<void> {
        await new Promise((resolve, reject) => {
            this.dialog.open({
                viewModel: InstallDialog,
            }).whenClosed(resolve, reject);
        });
    }
}
