import { inject, noView } from 'aurelia-framework';
import { remote } from 'electron';

@inject(Element)
@noView
export class ExternalHrefCustomAttribute {
    public value: string;

    constructor(private element: Element) {
        
    }
    
    public attached(): void {
        this.element.addEventListener('click', this.onClick);
    }

    public detached(): void {
        this.element.removeEventListener('click', this.onClick);
    }

    private onClick = (e: Event): boolean => {
        e.preventDefault();
        remote.shell.openExternal(this.value);
        return false;
    };
}
