let id = 0

export function generateId() {

  return (id++).toString()

}

type Maybe<T> = T | null | undefined

export function run<T>(runnable: () => T): [Maybe<T>, Maybe<Error>] {
  try {
    const r = runnable()
    return [r, null]
  } catch (e) {
    return [null, e as Error]
  }
}
