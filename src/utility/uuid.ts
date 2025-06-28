import { randomBytes } from 'crypto';

function rng(): Buffer {
    return randomBytes(20);
}

const byteMap = [];

for (let x = 0; x < 256; x++) {
    byteMap[x] = (x + 0x100).toString(16).substr(1);
}

function bytesToUuid(buffer: Buffer): string {

    let x = 0;
    return byteMap[buffer[x++]] + byteMap[buffer[x++]] +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] + '-' +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] + '-' +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] + '-' +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] + '-' +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] +
        byteMap[buffer[x++]] + byteMap[buffer[x++]] +
        byteMap[buffer[x++]] + byteMap[buffer[x++]];
}

export interface UuidOptions {
    binary?: boolean;
    rng?: () => Buffer;
}

export function v4(options?: UuidOptions): Buffer | string {

    options = options || {};

    const bytes = (options.rng || rng)();

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return options.binary ? bytes : bytesToUuid(bytes);
}

export function validateUuid(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}