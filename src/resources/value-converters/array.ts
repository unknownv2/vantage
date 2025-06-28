export class PluckValueConverter {
    public toView(value: object[], prop: string, def?: any): any[] {
        return value ? value.map(v => v.hasOwnProperty(prop) ? v[prop] : def) : [];
    }
}

export class TakeValueConverter {
    public toView(value: any[], count: number): any[] {
        return value && value.length != 0 ? value.slice(0, count) : [];
    }
}

export class SortValueConverter {
    public toView(value: object[], prop?: string): object[] {
        if (!value || value.length === 0) {
            return [];
        }
        if (!prop) {
            return value.sort();
        }
        if (typeof value[0][prop] === 'number') {
            return value.sort((a, b) => a[prop] > b[prop] ? 1 : (a[prop] < b[prop] ? -1 : 0));
        }
        return value.sort((a, b) => a[prop] && b[prop] ? a[prop].toString().localeCompare(b[prop].toString()) : 0);
    }
}

export class ReverseValueConverter {
    public toView(value: any[]): any[] {
        return value && value.slice(0).reverse();
    }
}

export class StringArrayValueConverter {
    public toView(items: string[], delim: string = ','): string {
        return items ? items.join(delim).replace(/\r/g, '') : '';
    }
    
    public fromView(str: string, delim: string = ','): string[] {
        return str ? str.replace(/\r/g, '').split(delim) : [];
    }
}
