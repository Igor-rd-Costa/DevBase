

export type SetStateFn<T> = ((value: T) => void) | ((prev: T) => T|Promise<T>);