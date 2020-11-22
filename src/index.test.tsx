import { is } from '.'

const expectGuard = (guard: ReturnType<typeof is>, value: unknown, expectTrue = true) => {
  expect(guard(value)).toBe(expectTrue)
}

const basicValues: Record<string, any> = {
  anyValue: undefined,
  booleanValue: true,
  bigintValue: BigInt(0),
  nullValue: null,
  numberValue: 0,
  objectValue: {},
  stringValue: '',
  symbolValue: Symbol(),
  undefinedValue: undefined,
  unknownValue: undefined,
}
const basicValueKeys = Object.keys(basicValues)

const basicTypes = [
  'any',
  'boolean',
  'bigint',
  'null',
  'number',
  'object',
  'string',
  'symbol',
  'undefined',
  'unknown',
] as const

describe('is', () => {
  it('guards basic types', () => {
    for (const t of basicTypes) {
      for (const k of basicValueKeys) {
        expectGuard(
          is(t),
          basicValues[k],
          t === 'any' ||
            t === 'unknown' ||
            (t === 'undefined' && (k.includes('any') || k.includes('unknown'))) ||
            (t === 'object' && k.includes('null'))
            ? true
            : k.includes(t)
        )
      }
    }
  })
  it('guards objects', () => {
    // Simple object
    expectGuard(is({}), {})

    // Single basic prop
    expectGuard(
      is({
        prop1: is('string'),
      }),
      {
        prop1: '',
      }
    )

    // Handles undefined props
    expectGuard(
      is({
        prop1: is('string'),
        prop2: is('undefined'),
      }),
      {
        prop1: '',
      }
    )

    // Allows extra props
    expectGuard(
      is({
        prop1: is('string'),
      }),
      {
        prop1: '',
        prop2: '',
      }
    )

    // Allows props of differing types
    expectGuard(
      is({
        prop1: is('string'),
        prop2: is('number'),
      }),
      {
        prop1: '',
        prop2: 0,
      }
    )
  })
  it('allows guard chaining', () => {
    const guard = is('boolean').or('null').or('number').or('string').or('undefined')
    expectGuard(guard, true)
    expectGuard(guard, null)
    expectGuard(guard, 0)
    expectGuard(guard, '')
    expectGuard(guard, undefined)
    expectGuard(guard, Symbol(), false)
    expectGuard(guard, {}, false)
  })
  it('allows guard of guards', () => {
    const stringGuard = is('string')
    const numberOrStringGuard = is('number').or(stringGuard)
    expectGuard(is(stringGuard), '')
    expectGuard(numberOrStringGuard, 0)
    expectGuard(numberOrStringGuard, '')
  })
})
