import * as path from 'path';

export class ReplaceValueConverter {
    public toView(subject: string, search: string, replace: string): string {
        return subject.replace(search, replace);
    }
}

export class LimitPathValueConverter {
    public toView(value: string, maxLength: number): string {
        if (!value || value.length <= maxLength) {
            return value;
        }
        const filename = path.basename(value);
        if (filename.length === maxLength) {
            return filename;
        } else if (filename.length >= maxLength - 3) {
            return '...' + filename.substr(3);
        } else if (filename.length >= maxLength - 4) {
            return '...' + path.sep + filename.substr(3);
        }
        const dir = path.dirname(value);
        const maxDirLength = maxLength - filename.length - 4;

        let leftSide = dir.substr(0, maxDirLength / 2 - 3);
        let leftIndex = leftSide.lastIndexOf(path.sep);
        if (leftIndex !== -1) {
            leftSide = leftSide.substr(0, leftIndex) + path.sep;
        }

        let rightSide = dir.substr(dir.length - (maxDirLength / 2 + 3));
        let rightIndex = rightSide.indexOf('\\');
        if (rightIndex !== -1) {
            rightSide = rightSide.substr(rightIndex);
        }

        return `${leftSide}...${rightSide}${path.sep}${filename}`;
    }
}