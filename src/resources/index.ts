import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
    config.globalResources([
        './custom-attributes/close-if-click-outside',
        './custom-attributes/external-href',
    	'./elements/inline-svg',
        './elements/status-ring.html',
    	'./elements/status-tip.html',
        './value-converters/env',
        './value-converters/array',
        './value-converters/number',
        './value-converters/object',
        './value-converters/string',
        './value-converters/time',
    ]);
}
