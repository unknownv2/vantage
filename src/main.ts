import { ConsoleAppender } from 'aurelia-logging-console';
import { Aurelia, FrameworkConfiguration } from 'aurelia-framework';
import { getLogger } from 'aurelia-logging';
import { remote } from 'electron';
import environment from './environment';
import * as logManager from 'aurelia-logging';

(<any>Promise).config({
    longStackTraces: environment.debug,
    warnings: {
        wForgottenReturn: false,
    },
});

export async function configure(aurelia: Aurelia): Promise<void> {
    console.info(`Vantage v${remote.app.getVersion()}`);

    aurelia.use
        .standardConfiguration() 
        .feature('resources')
        .feature('editor')
        .plugin('aurelia-dialog', config => {
            config.useDefaults();
            config.settings.lock = false;
            config.settings.enableEscClose = true;
        });

    aurelia.use.preTask(() => {
        logManager.addAppender(new ConsoleAppender());
        if (environment.debug) {
            logManager.setLevel(logManager.logLevel.debug);
        }
        return Promise.resolve();
    });

    if (environment.testing) {
        aurelia.use.plugin('aurelia-testing');
    }

    await aurelia.start();

    aurelia.setRoot('./app/app');
}
