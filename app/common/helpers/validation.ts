const TRUTHY_VALUES = [true, 'true']

export function getBoolean(a: unknown) {
  return TRUTHY_VALUES.some(function (t) {
    return t === a
  })
}
