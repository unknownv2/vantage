import { EditorProvider } from '../editor-provider';
import { readFile } from '../../utility/fs';

export class DiskEditorProvider implements EditorProvider {
    public getUrl(locator: string): string {
        return locator;
    }

    public async fetchPackageInfo(locator: string): Promise<any> {
        return JSON.parse(await readFile(locator + '/package.json', 'utf8'));
    }

    public async fetchEditor(locator: string): Promise<string> {
        return locator;
    }
}