/**
 * DDP change listener class.
 * @constructor
 * @param {Object} obj - Describes changes of interest.
 * @param {*} inst - Event handler instance.
 * @param {simpleDDP} [listenersArray = 'onChangeFuncs'] - Property name of event handler instance, array of listeners.
 */

export function ddpOnChange<T extends { [x: string]: any[] }>(obj: {}, inst: T, listenersArray: any = 'onChangeFuncs') {
  let _isStopped = true
  const start = () => {
    if (_isStopped) {
      inst[listenersArray].push(obj)
      _isStopped = false
    }
  }

  const stop = () => {
    const index = inst[listenersArray].indexOf(obj)
    if (index > -1) {
      inst[listenersArray].splice(index, 1)
      _isStopped = true
    }
  }

  start()
  return { start, stop }
}
