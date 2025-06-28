import { bindable, containerless, inject, inlineView, customElement } from 'aurelia-framework';
import { HttpClient } from 'aurelia-http-client';
import { MultiPromise } from '../../utility/async';

const cachedSvgs = new Map<string, string>();
const awaiters = new Map<string, MultiPromise<void>>();

let relativeBasePath = 'static/images';

@containerless()
@inlineView('<template></template>')
@customElement('inline-svg')
@inject(Element, HttpClient)
export class InlineSvgCustomElement {
    @bindable private src: string;
    private isAttached = false;

    constructor(private el: HTMLElement, private http: HttpClient) {

    }

    public attached(): Promise<void>|undefined {
        this.isAttached = true;
        if (this.src) {
            const awaiter = awaiters.get(this.src);
            if (awaiter) {
                return awaiter.await().then(() => this.setDomIfAttached(this.src));
            } else {
                this.setDomIfAttached(this.src);
            }
        }
        return undefined;
    }

    public detached(): void {
        this.isAttached = false;
    }

    private setDomIfAttached(svg: string): void {
        const parentElement = <Element>this.el.parentNode;
        if (this.isAttached && parentElement) {
            parentElement.innerHTML = cachedSvgs.get(svg) || '';
        }
    }

    private isPathAbsolute(src: string): boolean {
        return src.startsWith('https://') 
            || src.startsWith('http://') 
            || src.startsWith('file://') 
            || src.startsWith('/')
    }

    public srcChanged(src?: string): void {
        if (!src) {
            return;
        }

        if (cachedSvgs.has(src)) {
            this.setDomIfAttached(src);
            return;
        }

        if (awaiters.has(src)) {
            return;
        }

        const actualSrc = this.isPathAbsolute(src) ? src : `${relativeBasePath}/${src}`;

        awaiters.set(src, new MultiPromise(this.http.createRequest(actualSrc)
            .asGet()
            .withResponseType('text')
            .send()
            .then(response => {
                awaiters.delete(src);
                if (response.isSuccess) {
                    cachedSvgs.set(src, response.content);
                }
            })));
    }
}
