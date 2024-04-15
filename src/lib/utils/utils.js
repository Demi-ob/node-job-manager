"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQueueJobId = exports.generateDateWithoutSeconds = exports.generateRandom10DigitString = void 0;
function generateRandom10DigitString() {
    return Math.random().toString(36).substring(2, 12);
}
exports.generateRandom10DigitString = generateRandom10DigitString;
function generateDateWithoutSeconds() {
    return new Date().toLocaleDateString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}
exports.generateDateWithoutSeconds = generateDateWithoutSeconds;
function generateQueueJobId(uniquePrefix) {
    return `${uniquePrefix}_${generateDateWithoutSeconds()}`;
}
exports.generateQueueJobId = generateQueueJobId;
