import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { inject, noView } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';

@inject(Element, DialogService, EventAggregator)
@noView
export class CloseIfClickOutsideCustomAttribute {

    value;
    private editorListener: Subscription;
    
    constructor(
        private element: Element, 
        private dialogService: DialogService,
        private ea: EventAggregator) {
        this.closeIfClickOutside = this.closeIfClickOutside.bind(this);
        
    }

    unbind(): void {
        if (this.editorListener) {
            this.editorListener.dispose();
            this.editorListener = null;
        }
        document.removeEventListener('click', this.closeIfClickOutside);
    }

    valueChanged(): void {
        if (this.value) {
            this.editorListener = this.ea.subscribe('editor-focused', this.closeIfClickOutside);
            document.addEventListener('click', this.closeIfClickOutside);
        } else {
            this.unbind();
        }
    }

    closeIfClickOutside(e): void {
        
        // Ignore clicks in dialogs.
        if (this.dialogService.hasActiveDialog) {
            return;
        }

        if (!this.element.contains(e.target)) {

            // Reject clicks on elements that have since become orphaned by checking whether
            // any of their parents is a Document Fragment (nodeType == 11)
            
            let node = e.target;
            while (node.parentNode) {
                node = node.parentNode;
                if (node.nodeType == 11) { return; }
            }

            // Otherwise, target element is outside

            this.value = false;
        }
    }
}
