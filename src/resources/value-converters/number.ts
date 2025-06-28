export class NumberWithCommasValueConverter {    
    public toView(value: number): string {
        return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }

    public fromView(value: string): number {
        return parseFloat(value.replace(/,/, ''));
    }
}

const sizeStrings = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export class ByteFormatValueConverter {
    public toView(value: number, fractionDigits: number = 2): string {
        if (value === 0) {
            return `0 ${sizeStrings[0]}`;
        }
        const x = Math.floor(Math.log(value) / Math.log(1024));
        return parseFloat((value / Math.pow(1024, x)).toFixed(fractionDigits)) + ' ' + sizeStrings[x];
    }
}