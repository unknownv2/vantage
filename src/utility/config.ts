import { inject } from 'aurelia-framework';

interface AppConfig {
    officialEditors: string[];
}

export class AppConfigService {
    public officialEditors = [
        'github:vantagemods/gears-of-war-4',
        'github:unknownv2/vantage-cuphead',
        'github:unknownv2/vantage-fallout-shelter',
        'github:unknownv2/vantage-resident-evil-7',
        'github:unknownv2/vantage-ark-SE',
    ];

    public refresh(): Promise<AppConfigService> {
        return Promise.resolve(this);
    }
}
