/**
 * DDP event listener
 * @param {String} eventname - Event name.
 * @param {Function} f - Function to run when event is fired.
 * @param {DDPClient} ddplink - simpleDDP instance.
 */
import DDPClient, { DDPMessage } from "../DDPClient";

export function ddpEventListener(eventname: string, f: (message: DDPMessage, id: string) => void, ddplink: DDPClient) {
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
