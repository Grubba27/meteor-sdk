"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.generateId = void 0;
let id = 0;
function generateId() {
    return (id++).toString();
}
exports.generateId = generateId;
function run(runnable) {
    try {
        const r = runnable();
        return [r, null];
    }
    catch (e) {
        return [null, e];
    }
}
exports.run = run;
