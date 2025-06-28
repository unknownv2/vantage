import { getLaunchUri, registerUriHandler } from '../utility/electron';
import { Router, RouterConfiguration } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import { EditorManager } from '../editor/editor-manager';
import { InstallDialog } from './install-dialog';
import { DialogService } from 'aurelia-dialog';
import { AppConfigService } from '../utility/config';
import { reportEvent } from '../utility/ga';
import { inject } from 'aurelia-framework';
import environment from '../environment';
import routes from './routes';

@inject(DialogService, AppConfigService, EditorManager)
export class App {
    public router: Router;

    constructor(private dialog: DialogService, private config: AppConfigService, private editorManager: EditorManager) {

    }

    public configureRouter(config: RouterConfiguration, router: Router): void {
        config.title = 'Vantage';
        config.options.root = '/';

        config.addPipelineStep('postcomplete', ScrollToTopStep);
        config.addPipelineStep('preActivate', PreActivateStep);

        config.map(routes);
        config.mapUnknownRoutes('default');
        config.fallbackRoute('default');

        this.router = router;
    }

    public activate(): void {
        reportEvent('App', 'Start');
    }

    public async attached(): Promise<void> {
        await this.editorManager.refresh();
        try {
            const result = await this.config.refresh();
            await Promise.all(result.officialEditors.map(e => {
                const x = e.indexOf(':');
                return this.editorManager.install(e.substr(0, x), e.substr(x + 1), true);
            }));
            this.editorManager.editors
                .filter(e => e.official && !result.officialEditors.includes(`${e.provider}:${e.locator}`))
                .forEach(e => this.editorManager.uninstall(e));
        } catch (e) {
            // No connection?
        }
        registerUriHandler(uri => this.handleUri(uri));
        this.handleUri(getLaunchUri());
        setInterval(() => this.editorManager.checkForUpdates(), 10 * 60 * 1000);
        this.editorManager.checkForUpdates();
    }

    private handleUri(uri: string): void {
        if (!uri || !uri.startsWith('vantage://')) {
            return;
        }
        const path = uri.substr('vantage://'.length);
        if (path.startsWith('install/')) {
            this.dialog.open({
                viewModel: InstallDialog,
                model: path.substr('install/'.length),
            });
        }
    }
}

class ScrollToTopStep {
    public run(routingContext, next: Function): any {
        const el = document.querySelector('router-view');
        if (el) { 
            el.scrollTop = 0;
        }
        return next();
    }
}

// Allows us to subscribe to the preActivate step in the router pipeline

@inject(EventAggregator)
class PreActivateStep {
    constructor(private ea: EventAggregator) {
        
    }

    public run(routingCOntext, next: Function): any {
        this.ea.publish('router:pipeline:preActivate');
        return next();
    }
}
