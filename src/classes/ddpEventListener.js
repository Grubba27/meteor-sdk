"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddpEventListener = void 0;
function ddpEventListener(eventname, f, ddplink) {
    let _started = false;
    const start = () => {
        if (!_started) {
            ddplink.ddpConnection.on(eventname, f);
            _started = true;
        }
    };
    const stop = () => {
        if (_started) {
            ddplink.ddpConnection.removeListener(eventname, f);
            _started = false;
        }
    };
    start();
    return { start, stop };
}
exports.ddpEventListener = ddpEventListener;
