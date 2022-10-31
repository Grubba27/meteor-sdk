/**
 * DDP event listener
 * @param {String} eventname - Event name.
 * @param {Function} f - Function to run when event is fired.
 * @param {simpleDDP} ddplink - simpleDDP instance.
 */
import simpleDDP, { DDPMessage } from "../simpleDDP";

export function ddpEventListener(eventname: string, f: (message: DDPMessage, id: string) => void, ddplink: simpleDDP) {
  let _started = false
  const start = () => {
    if (!_started) {
      ddplink.ddpConnection.on(eventname, f);
      _started = true
    }
  }

  const stop = () => {
    if (_started) {
      ddplink.ddpConnection.removeListener(eventname, f);
      _started = false
    }
  }

  start()
  return { start, stop }
}
