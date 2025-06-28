import * as moment from 'moment';

export class FriendlyDateValueConverter {
    public toView(value: string, format?: string, def?: string): string {
        return value ? moment(value).format(format || 'MMMM DD, YYYY') : def;
    }
}

export class RelativeTimeValueConverter {
    public toView(value: string|number|Date, invalidString?: string): string {
        if (typeof value === 'number') {
            value = new Date(value);
        }
        return value ? moment.utc(value).fromNow() : (invalidString || '');
    }
}

export class ShortDateValueConverter {
    public toView(value: string, format?: string, def?: string): string {
        return value ? moment(value).format(format || 'M/D/YY') : def;
    }
}