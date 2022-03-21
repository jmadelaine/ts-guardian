import { assertThat, is, isArrayOf, isInstanceOf, isLiterally, parserFor } from '..'

const expectGuard = (guard: ReturnType<typeof is>, value: unknown, expectTrue = true) => {
  expect(guard(value)).toBe(expectTrue)
}

const basicValues: Record<string, any> = {
  anyValue: undefined,
  booleanValue: true,
  bigintValue: BigInt(0),
  functionValue: () => undefined,
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
  'function',
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
    expectGuard(is({ prop1: is('string') }), { prop1: '' })
    // Handles undefined props
    expectGuard(is({ prop1: is('string'), prop2: is('undefined') }), { prop1: '' })
    // Allows extra props
    expectGuard(is({ prop1: is('string') }), { prop1: '', prop2: '' })
    // Allows props of differing types
    expectGuard(is({ prop1: is('string'), prop2: is('number') }), { prop1: '', prop2: 0 })
    // Allows nested guards
    expectGuard(is({ a: is({ b: is('string') }) }), { a: { b: '' } })
    // Allows nested objects and basic types
    expectGuard(is({ a: { b: 'string' } }), { a: { b: '' } })
  })
  it('guards tuples', () => {
    const str = is('string')
    const num = is('number')
    // Simple object
    expectGuard(is([str]), [''])
    expectGuard(is([num]), [5])
    expectGuard(is([str, num]), ['', 5])
    expectGuard(is([str, num]), [5, ''], false)
    expectGuard(is(['string']), [''])
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
  it("allows chaining 'orArray'", () => {
    const guard = is('string').orArrayOf('number')
    expectGuard(guard, '')
    expectGuard(guard, [])
    expectGuard(guard, [1])
    expectGuard(guard, [2, 3, 4])
    expectGuard(guard, [5, '6', 7], false)
  })
  it('Does not mutate orTypes of extended guards', () => {
    const guard = is('string')
    expectGuard(is('string'), undefined, false)
    expectGuard(guard, undefined, false)
    // In v0.0.4 this would mutate guard's orTypes,
    // meaning the next type check would return true
    guard.or('undefined')
    expectGuard(guard, undefined, false)
  })
})

describe('isArrayOf', () => {
  it('guards basic array types', () => {
    for (const t of basicTypes) {
      for (const k of basicValueKeys) {
        expectGuard(
          isArrayOf(t),
          [basicValues[k]],
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
    expectGuard(isArrayOf({}), [{}])
    // Single basic prop
    expectGuard(isArrayOf({ prop1: is('string') }), [{ prop1: '' }])
  })
  it('allows guard chaining', () => {
    const guard = isArrayOf('boolean').or('null').orArrayOf('number')
    expectGuard(guard, [true, false])
    expectGuard(guard, null)
    expectGuard(guard, [0, 1, 2])
    expectGuard(guard, [])
    expectGuard(guard, [true, 0, 1, false], false)
    expectGuard(guard, '', false)
    expectGuard(guard, 0, false)
  })
  it('allows guard of guards', () => {
    const guard = isArrayOf(is('boolean').or('number'))
    expectGuard(guard, [true, false])
    expectGuard(guard, [0, 1, 2])
    expectGuard(guard, [])
    expectGuard(guard, [true, 0, 1, false])
    expectGuard(guard, [''], false)
    expectGuard(guard, 0, false)
  })
})

describe('parser', () => {
  it('parses basic types', () => {
    const a = ''
    expect(parserFor(is('any'))(a)).toBe(a)
    const bo = true
    expect(parserFor(is('boolean'))(bo)).toBe(bo)
    const bi = BigInt(1)
    expect(parserFor(is('bigint'))(bi)).toBe(bi)
    const f = () => undefined
    expect(parserFor(is('function'))(f)).toBe(f)
    const nul = null
    expect(parserFor(is('null'))(nul)).toBe(nul)
    const num = 0
    expect(parserFor(is('number'))(num)).toBe(num)
    const o = {}
    expect(parserFor(is('object'))(o)).toBe(o)
    const st = ''
    expect(parserFor(is('string'))(st)).toBe(st)
    const sy = Symbol()
    expect(parserFor(is('symbol'))(sy)).toBe(sy)
    const und = undefined
    expect(parserFor(is('undefined'))(und)).toBe(und)
    const unk = ''
    expect(parserFor(is('unknown'))(unk)).toBe(unk)

    expect(parserFor(is('number'))(st)).toBe(undefined)
    expect(parserFor(is('string'))(num)).toBe(undefined)
  })
  it('parses objects', () => {
    const o = { prop1: 'hello' }
    const guardSuccess = is({ prop1: is('string') })
    const guardFail = is({ prop1: is('string'), prop2: is('string') })
    expect(parserFor(guardSuccess)(o)).toBe(o)
    expect(parserFor(guardFail)(o)).toBe(undefined)
  })
})

describe('isLiterally', () => {
  it('handles strings', () => {
    expectGuard(isLiterally('hello'), 'hello')
    expectGuard(isLiterally('hello'), 'cool', false)
    expectGuard(isLiterally('hello').orLiterally('cool'), 'hello')
    expectGuard(isLiterally('hello').orLiterally('cool'), 'cool')
    expectGuard(isLiterally('hello').orLiterally('cool'), 'nope', false)
  })
  it('handles numbers', () => {
    expectGuard(isLiterally(5), 5)
    expectGuard(isLiterally(5), 6, false)
  })
  it('handles booleans', () => {
    expectGuard(isLiterally(true), true)
    expectGuard(isLiterally(true), false, false)
  })
  it('handles string versions of basic types', () => {
    expectGuard(isLiterally('true'), 'true')
    expectGuard(isLiterally('true'), true, false)
    expectGuard(isLiterally('string'), 'string')
    expectGuard(isLiterally('string'), 'strin', false)
  })
  it('handles multiple arguments', () => {
    expectGuard(isLiterally('a', 'b', 1), 'a')
    expectGuard(isLiterally('a', 'b', 1), 'b')
    expectGuard(isLiterally('a', 'b', 1), 1)
    expectGuard(isLiterally('a', 'b', 1), 'c', false)
    expectGuard(isLiterally('a', 'b', 1), 2, false)
  })
})

describe('assertThat', () => {
  it('asserts types', () => {
    const isString = is('string')
    expect(() => assertThat(5, isString)).toThrowError(
      "Type of '5' does not match type guard 'Guard<string>'."
    )
    const isNumber = is('number')
    expect(() => assertThat(5, isNumber)).not.toThrow()
  })
})

it('has descriptive guard names', () => {
  expect(is('any').name).toBe('Guard<any>')
  expect(is('boolean').name).toBe('Guard<boolean>')
  expect(is('bigint').name).toBe('Guard<bigint>')
  expect(is('function').name).toBe('Guard<function>')
  expect(is('null').name).toBe('Guard<null>')
  expect(is('number').name).toBe('Guard<number>')
  expect(is('object').name).toBe('Guard<object>')
  expect(is('string').name).toBe('Guard<string>')
  expect(is('symbol').name).toBe('Guard<symbol>')
  expect(is('undefined').name).toBe('Guard<undefined>')
  expect(is('unknown').name).toBe('Guard<unknown>')
  expect(is('string').or('number').name).toBe('Guard<string | number>')

  expect(isLiterally('hello').name).toBe('Guard<"hello">')
  expect(isLiterally(5).name).toBe('Guard<5>')
  expect(isLiterally(true).name).toBe('Guard<true>')
  expect(isLiterally('a', 'b', 1, true).name).toBe('Guard<"a" | "b" | 1 | true>')

  expect(isArrayOf('string').or('number').name).toBe('Guard<string[] | number>')
  expect(isArrayOf('string').orArrayOf('number').name).toBe('Guard<string[] | number[]>')
  expect(isArrayOf(is('string').or('number')).name).toBe('Guard<(string | number)[]>')

  expect(is([is('string')]).name).toBe('Guard<[string]>')
  expect(is([is('string'), is('number')]).name).toBe('Guard<[string, number]>')
  expect(is([isArrayOf('string').or([is('boolean')]), is('number')]).name).toBe(
    'Guard<[string[] | [boolean], number]>'
  )

  expect(is({}).name).toBe('Guard<{}>')

  expect(isInstanceOf(Date).name).toBe('Guard<Date>')

  // TODO: Names guards based on object member guards, i.e. Guard<{ something: string; }>
  expect(is({ something: is('string') }).name).toBe('Guard<{}>')
  expect(is({ a: is('string') }).and({ b: is('string') }).name).toBe('Guard<{} & {}>')
})

describe('instanceOf', () => {
  it('gaurds constructor objects', () => {
    expectGuard(isInstanceOf(Object), {})
    expectGuard(isInstanceOf(String), '', false)
    expectGuard(isInstanceOf(Date), new Date())
    expectGuard(isInstanceOf(Date), Date, false)
    expectGuard(isInstanceOf(RegExp), /0/)
    expectGuard(isInstanceOf(Date).orInstanceOf(RegExp), new Date())
    expectGuard(isInstanceOf(Date).orInstanceOf(RegExp), new RegExp('0'))
    class Person {}
    expectGuard(isInstanceOf(Person), new Person())
  })
})

describe('and', () => {
  it('intersects types', () => {
    expectGuard(is({ a: is('string') }).and({ b: is('number') }), { a: '', b: 0 })
  })

  it('intersects complex types', () => {
    const isA = is({ a: is('string') })
    const isB = is({ b: is('string') })
    const isC = is({ c: is('string') })
    const isD = is({ d: is('string') })
    const value1 = { a: '', b: '' }
    const value2 = { c: '' }
    const value3 = { c: '', d: '' }
    expectGuard(isA.and(isB).or(isC), value1)
    expectGuard(isA.and(isB).or(isC), value2)
    expectGuard(isA.or(isB).and(isC), value1)
    expectGuard(isA.or(isB).and(isC), value2, false)
    expectGuard(isA.and(isB).or(isC).or(isD), value2)
    expectGuard(isA.and(isB).or(isC).and(isD), value2, false)
    expectGuard(isA.and(isB).or(isC).and(isD), value3)
  })
})
