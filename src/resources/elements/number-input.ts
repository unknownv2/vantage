import { bindable } from 'aurelia-framework';

export class NumberInput {
    @bindable value: number;
    @bindable min: number;
    @bindable max: number;
    @bindable step: number;
    @bindable disabled: boolean;

    matchPrecision(a: number, b: number): number {
        const decPlaces = (a.toString().split('.')[1] || []).length;
        if (decPlaces > 0) {
            return parseFloat(b.toPrecision(decPlaces));
        }
        return b;
    }

    add(): void {
        this.value = parseFloat(this.value.toString());
        this.value += this.step;
        this.value = this.matchPrecision(this.step, this.value);
        if (this.value > this.max) {
            this.value = this.max;
        }
    }

    subtract(): void {
        this.value = parseFloat(this.value.toString());
        this.value -= this.step;
        this.value = this.matchPrecision(this.step, this.value);
        if (this.value < this.min) {
            this.value = this.min;
        }
    }
}
