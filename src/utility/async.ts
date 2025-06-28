import { IDisposable } from './disposable';

// Requires bluebird.
export function promisifyAll<T extends object>(obj: T): T {
    return (<any>Promise).promisifyAll(obj);
}

export function promisify(func: Function): Function {
    return (<any>Promise).promisify(func);
}

export class MultiPromise<T> implements IDisposable {
    protected resolvers: Function[]|null = [];
    protected rejectors: Function[]|null = [];
    protected result: any;
    protected resolved = false;
    protected rejected = false;

    constructor(promise: Promise<T>) {
        promise.then(value => {
            this.resolved = true;
            this.result = value;
            if (this.resolvers) {
                for (const resolver of this.resolvers) {
                    try {
                        resolver(value);
                    } catch (e) {
                        console.warn('Uncaught exception thrown in MultiPromise fulfillment handler.', e);
                    }
                }
                this.dispose();
            }
        }).catch(e => {
            this.rejected = true;
            this.result = e;
            if (this.rejectors) {
                for (const rejector of this.rejectors) {
                    try {
                        rejector(e);
                    } catch (e) {
                        console.warn('Uncaught exception thrown in MultiPromise rejection handler.', e);
                    }
                }
                this.dispose();
            }
        });
    }

    public static wrap<T>(promise: Promise<T>): MultiPromise<T> {
        return new MultiPromise(promise);
    }

    public await(): Promise<T> {
        if (this.resolved) {
            return Promise.resolve(this.result);
        }

        if (this.rejected) {
            return Promise.reject(this.result);
        }

        return new Promise<T>((resolve, reject) => {
            if (this.resolvers && this.rejectors) {
                this.resolvers.push(resolve);
                this.rejectors.push(reject);
            }
        })
    }

    public dispose(): void {
        this.resolvers = null;
        this.rejectors = null;
    }
}