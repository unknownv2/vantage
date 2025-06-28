import environment from '../../environment';

export class EnvValueConverter {
    public toView(key: string, trusy?: any, falsy?: any): boolean {
        const exists = !!environment[key];
        return typeof trusy === 'undefined' ? exists : exists ? trusy : falsy;
    }
}