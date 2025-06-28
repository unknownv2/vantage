import { HttpClient } from 'aurelia-fetch-client';
import environment from '../environment';
import { remote } from 'electron';
import * as uuid from './uuid';
import * as path from 'aurelia-path';

const baseUrl = 'https://www.google-analytics.com';

const apiVersion = '1';
const http = new HttpClient();
let lastScreen: string;

http.baseUrl = baseUrl;

if (environment.debug) {
    http.baseUrl += '/debug';
}

function screenResolution(): string {
    return `${screen.width}x${screen.height}`;
}

function userAgent(): string {
    return navigator.userAgent;
}

function colorDepth(): string {
    return `${screen.colorDepth}-bits`;
}

function viewPortSize(): string {
    return `${screen.availWidth}x${screen.availHeight}`;
}

function clientId(): string {
    let clientId = localStorage.getItem('gaClientId');
    if (!clientId) {
        clientId = <string>uuid.v4();
        localStorage.setItem('gaClientId', clientId);
    }
    return clientId;
}

async function report(data: {}): Promise<void> {
    if (!environment.gaTrackingId) {
        return;
    }

    data = Object.assign({
        v: apiVersion,
        tid: environment.gaTrackingId,
        cid: clientId(),
        an: 'Vantage',
        av: remote.app.getVersion(),
        sr: screenResolution(),
        vp: viewPortSize(),
        sd: colorDepth(),
        ua: userAgent(),
        ds: 'app',
    }, data);

    try {
        await http.fetch('/collect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: path.buildQueryString(data),
            cache: 'no-cache',
        });
    } catch (e) {
        // We don't care.
    }
}

export function reportEvent(category: string, action: string, label?: string, value?: number): Promise<void> {
    return report({
        t: 'event',
        ec: category,
        ea: action,
        el: label,
        ev: value,
        cd: lastScreen,
    });
}

export function reportScreen(name: string): Promise<void> {
    lastScreen = name;
    return report({
        t: 'screenview',
        cd: name,
    });
}