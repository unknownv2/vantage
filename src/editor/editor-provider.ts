export interface EditorProvider {
    fetchEditor(locator: string): Promise<string>;
    fetchPackageInfo(locator: string): Promise<any>;
    getUrl(locator: string): string;
}