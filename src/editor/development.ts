import * as net from 'net';

async function tryFetch(address: string): Promise<boolean> {
    try {
        await fetch(address);
        return true;
    } catch (e) {
        return false;
    }
}

export async function portInUse(port: number): Promise<boolean> {
    return <Promise<boolean>>Promise.race([
        tryFetch(`http://127.0.0.1:${port}`),
        new Promise(r => setTimeout(() => r(false), 500)),
    ]);
}