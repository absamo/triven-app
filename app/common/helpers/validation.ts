const TRUTHY_VALUES = [true, 'true']

export function getBoolean(a: unknown) {
  return TRUTHY_VALUES.some((t) => t === a)
}
