export class ObjectKeysValueConverter {
    public toView(value: object): string[] {
        return value ? Object.getOwnPropertyNames(value).filter(k => !k.startsWith('__')) : [];
    }
}