import { bindable, inject } from 'aurelia-framework';

@inject(Element)
export class SelectionInput {
    @bindable value: string;
    @bindable options: string[];
    @bindable disabled: boolean;

    opened = false;

    constructor(private element: HTMLElement) {
        this.closeIfClickOutside = this.closeIfClickOutside.bind(this);
    }

    open(): void {
        this.opened = true;
        document.addEventListener('click', this.closeIfClickOutside);
    }

    close(): void {
        this.opened = false;
        document.removeEventListener('click', this.closeIfClickOutside);
    }

    closeIfClickOutside(e): void {
        if (!this.element.contains(e.target)) {
            this.close();
        }
    }

    setValue(value: string): void {
        this.value = value;
        this.opened = false;
    }

    detached() {
        this.close();
    }
}
