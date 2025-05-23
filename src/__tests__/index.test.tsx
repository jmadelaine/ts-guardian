import { is, isArrayOf, isInstanceOf, isLiterally, isNullable, isNullish, isOptional, isRecordOf, parserFor, requireThat } from '..'

const values = [true, BigInt(0), () => undefined, null, 0, {}, '', Symbol(), undefined]
const f = false

describe('is', () => {
  it('guards basic types', () => {
    expect(values.map(is('any'))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(is('boolean'))).toEqual([true, f, f, f, f, f, f, f, f])
    expect(values.map(is('bigint'))).toEqual([f, true, f, f, f, f, f, f, f])
    expect(values.map(is('function'))).toEqual([f, f, true, f, f, f, f, f, f])
    expect(values.map(is('null'))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(is('number'))).toEqual([f, f, f, f, true, f, f, f, f])
    expect(values.map(is('object'))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(is('string'))).toEqual([f, f, f, f, f, f, true, f, f])
    expect(values.map(is('symbol'))).toEqual([f, f, f, f, f, f, f, true, f])
    expect(values.map(is('undefined'))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(is('unknown'))).toEqual([true, true, true, true, true, true, true, true, true])
  })
  it('guards basic array types', () => {
    expect(values.map(v => is('any[]')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(v => is('boolean[]')([v]))).toEqual([true, f, f, f, f, f, f, f, f])
    expect(values.map(v => is('bigint[]')([v]))).toEqual([f, true, f, f, f, f, f, f, f])
    expect(values.map(v => is('function[]')([v]))).toEqual([f, f, true, f, f, f, f, f, f])
    expect(values.map(v => is('null[]')([v]))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(v => is('number[]')([v]))).toEqual([f, f, f, f, true, f, f, f, f])
    expect(values.map(v => is('object[]')([v]))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(v => is('string[]')([v]))).toEqual([f, f, f, f, f, f, true, f, f])
    expect(values.map(v => is('symbol[]')([v]))).toEqual([f, f, f, f, f, f, f, true, f])
    expect(values.map(v => is('undefined[]')([v]))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(v => is('unknown[]')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
  })
  it('guards basic optional types', () => {
    expect(values.map(is('boolean?'))).toEqual([true, f, f, f, f, f, f, f, true])
    expect(values.map(is('bigint?'))).toEqual([f, true, f, f, f, f, f, f, true])
    expect(values.map(is('function?'))).toEqual([f, f, true, f, f, f, f, f, true])
    expect(values.map(is('null?'))).toEqual([f, f, f, true, f, f, f, f, true])
    expect(values.map(is('number?'))).toEqual([f, f, f, f, true, f, f, f, true])
    expect(values.map(is('object?'))).toEqual([f, f, f, true, f, true, f, f, true])
    expect(values.map(is('string?'))).toEqual([f, f, f, f, f, f, true, f, true])
    expect(values.map(is('symbol?'))).toEqual([f, f, f, f, f, f, f, true, true])
    expect(values.map(v => is('any[]?')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(v => is('boolean[]?')([v]))).toEqual([true, f, f, f, f, f, f, f, f])
    expect(values.map(v => is('bigint[]?')([v]))).toEqual([f, true, f, f, f, f, f, f, f])
    expect(values.map(v => is('function[]?')([v]))).toEqual([f, f, true, f, f, f, f, f, f])
    expect(values.map(v => is('null[]?')([v]))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(v => is('number[]?')([v]))).toEqual([f, f, f, f, true, f, f, f, f])
    expect(values.map(v => is('object[]?')([v]))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(v => is('string[]?')([v]))).toEqual([f, f, f, f, f, f, true, f, f])
    expect(values.map(v => is('symbol[]?')([v]))).toEqual([f, f, f, f, f, f, f, true, f])
    expect(values.map(v => is('undefined[]?')([v]))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(v => is('unknown[]?')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(is('any[]?')(undefined)).toEqual(true)
    expect(is('boolean[]?')(undefined)).toEqual(true)
    expect(is('bigint[]?')(undefined)).toEqual(true)
    expect(is('function[]?')(undefined)).toEqual(true)
    expect(is('null[]?')(undefined)).toEqual(true)
    expect(is('number[]?')(undefined)).toEqual(true)
    expect(is('object[]?')(undefined)).toEqual(true)
    expect(is('string[]?')(undefined)).toEqual(true)
    expect(is('symbol[]?')(undefined)).toEqual(true)
    expect(is('undefined[]?')(undefined)).toEqual(true)
    expect(is('unknown[]?')(undefined)).toEqual(true)
  })
  it('guards objects', () => {
    // Empty object
    expect(is({})({})).toEqual(true)
    // Basic type props
    expect(is({ a: 'string' })({ a: '' })).toEqual(true)
    // Guard props
    expect(is({ a: is('string') })({ a: '' })).toEqual(true)
    // Undefined props
    expect(is({ a: 'undefined' })({})).toEqual(true)
    expect(is({ a: 'undefined' })({ a: undefined })).toEqual(true)
    // Ignores unspecified props
    expect(is({ a: 'string' })({ a: '', b: 0 })).toEqual(true)
    // Props of different types
    expect(is({ a: 'string', b: 'number' })({ a: '', b: 0 })).toEqual(true)
    // Nested objects
    expect(is({ a: { b: 'string' } })({ a: { b: '' } })).toEqual(true)
    // Nested guard objects
    expect(is({ a: is({ b: 'string' }) })({ a: { b: '' } })).toEqual(true)
  })
  it('guards tuples', () => {
    // Empty tuple
    expect(is([])([])).toEqual(true)
    // Basic type elements
    expect(is(['string'])([''])).toEqual(true)
    // Guard elements
    expect(is(['string'])([''])).toEqual(true)
    // Undefined elements
    expect(is(['undefined'])([])).toEqual(true)
    expect(is(['undefined'])([undefined])).toEqual(true)
    // Ignores unspecified elements
    expect(is(['string'])(['', 0])).toEqual(true)
    // Elements of different types
    expect(is(['string', 'number'])(['', 0])).toEqual(true)
    // Nested guard tuples
    expect(is([is(['string'])])([['']])).toEqual(true)
  })
  it('chains guards', () => {
    expect(is('string').or('number')('')).toEqual(true)
    expect(is('string').or('number')(0)).toEqual(true)
    expect(is('string').or('number')(true)).toEqual(false)
  })
  it('accepts guard arguments', () => {
    expect(is(is('string')).or(is('number'))('')).toEqual(true)
    expect(is(is('string')).or(is('number'))(0)).toEqual(true)
    expect(is(is('string')).or(is('number'))(true)).toEqual(false)
  })
  it('does not mutate extended guards', () => {
    const g0 = is('string')
    const g1 = g0.or('number')
    expect(g0('')).toEqual(true)
    expect(g0(0)).toEqual(false)
    expect(g1('')).toEqual(true)
    expect(g1(0)).toEqual(true)
  })
})

describe('isArrayOf', () => {
  it('guards basic types', () => {
    expect(values.map(v => isArrayOf('any')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(v => isArrayOf('boolean')([v]))).toEqual([true, f, f, f, f, f, f, f, f])
    expect(values.map(v => isArrayOf('bigint')([v]))).toEqual([f, true, f, f, f, f, f, f, f])
    expect(values.map(v => isArrayOf('function')([v]))).toEqual([f, f, true, f, f, f, f, f, f])
    expect(values.map(v => isArrayOf('null')([v]))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(v => isArrayOf('number')([v]))).toEqual([f, f, f, f, true, f, f, f, f])
    expect(values.map(v => isArrayOf('object')([v]))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(v => isArrayOf('string')([v]))).toEqual([f, f, f, f, f, f, true, f, f])
    expect(values.map(v => isArrayOf('symbol')([v]))).toEqual([f, f, f, f, f, f, f, true, f])
    expect(values.map(v => isArrayOf('undefined')([v]))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(v => isArrayOf('unknown')([v]))).toEqual([true, true, true, true, true, true, true, true, true])
  })
  it('guards objects', () => {
    expect(isArrayOf({ a: 'string' })([{ a: '' }])).toEqual(true)
  })
  it('guards tuples', () => {
    expect(isArrayOf(['string'])([['']])).toEqual(true)
  })
  it('chains guards', () => {
    expect(isArrayOf('string').orArrayOf('number')([''])).toEqual(true)
    expect(isArrayOf('string').orArrayOf('number')([0])).toEqual(true)
    expect(isArrayOf('string').orArrayOf('number')([true])).toEqual(false)
  })
  it('accepts guard arguments', () => {
    expect(isArrayOf(is('string')).orArrayOf(is('number'))([''])).toEqual(true)
    expect(isArrayOf(is('string')).orArrayOf(is('number'))([0])).toEqual(true)
    expect(isArrayOf(is('string')).orArrayOf(is('number'))([true])).toEqual(false)
  })
  it('accepts complex guard arguments', () => {
    expect(isArrayOf(is('string').or('number'))(['', 0])).toEqual(true)
  })
  it('does not mutate extended guards', () => {
    const g0 = isArrayOf('string')
    const g1 = g0.orArrayOf('number')
    expect(g0([''])).toEqual(true)
    expect(g0([0])).toEqual(false)
    expect(g1([''])).toEqual(true)
    expect(g1([0])).toEqual(true)
  })
})

describe('isRecordOf', () => {
  it('guards basic types', () => {
    expect(values.map(v => isRecordOf('any')({ k: v }))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(v => isRecordOf('boolean')({ k: v }))).toEqual([true, f, f, f, f, f, f, f, f])
    expect(values.map(v => isRecordOf('bigint')({ k: v }))).toEqual([f, true, f, f, f, f, f, f, f])
    expect(values.map(v => isRecordOf('function')({ k: v }))).toEqual([f, f, true, f, f, f, f, f, f])
    expect(values.map(v => isRecordOf('null')({ k: v }))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(v => isRecordOf('number')({ k: v }))).toEqual([f, f, f, f, true, f, f, f, f])
    expect(values.map(v => isRecordOf('object')({ k: v }))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(v => isRecordOf('string')({ k: v }))).toEqual([f, f, f, f, f, f, true, f, f])
    expect(values.map(v => isRecordOf('symbol')({ k: v }))).toEqual([f, f, f, f, f, f, f, true, f])
    expect(values.map(v => isRecordOf('undefined')({ k: v }))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(v => isRecordOf('unknown')({ k: v }))).toEqual([true, true, true, true, true, true, true, true, true])
  })
  it('guards objects', () => {
    expect(isRecordOf({ a: 'string' })({ k: { a: '' } })).toEqual(true)
  })
  it('guards tuples', () => {
    expect(isRecordOf(['string'])({ k: [''] })).toEqual(true)
  })
  it('chains guards', () => {
    expect(isRecordOf('string').orRecordOf('number')({ k: '' })).toEqual(true)
    expect(isRecordOf('string').orRecordOf('number')({ k: 0 })).toEqual(true)
    expect(isRecordOf('string').orRecordOf('number')({ k: true })).toEqual(false)
  })
  it('accepts guard arguments', () => {
    expect(isRecordOf(is('string')).orRecordOf(is('number'))({ k: '' })).toEqual(true)
    expect(isRecordOf(is('string')).orRecordOf(is('number'))({ k: 0 })).toEqual(true)
    expect(isRecordOf(is('string')).orRecordOf(is('number'))({ k: true })).toEqual(false)
  })
  it('accepts complex guard arguments', () => {
    expect(isRecordOf(is('string').or('number'))({ k: '', l: 0 })).toEqual(true)
  })
  it('does not mutate extended guards', () => {
    const g0 = isRecordOf('string')
    const g1 = g0.orRecordOf('number')
    expect(g0({ k: '' })).toEqual(true)
    expect(g0({ k: 0 })).toEqual(false)
    expect(g1({ k: '' })).toEqual(true)
    expect(g1({ k: 0 })).toEqual(true)
  })
})

describe('isLiterally', () => {
  it('handles strings', () => {
    expect(isLiterally('a')('a')).toEqual(true)
    expect(isLiterally('a')('b')).toEqual(false)
    expect(isLiterally('a').orLiterally('b')('a')).toEqual(true)
    expect(isLiterally('a').orLiterally('b')('b')).toEqual(true)
    expect(isLiterally('a').orLiterally('b')('c')).toEqual(false)
  })
  it('handles numbers', () => {
    expect(isLiterally(5)(5)).toEqual(true)
    expect(isLiterally(5)(6)).toEqual(false)
    expect(isLiterally(5).orLiterally(6)(5)).toEqual(true)
    expect(isLiterally(5).orLiterally(6)(6)).toEqual(true)
    expect(isLiterally(5).orLiterally(6)(7)).toEqual(false)
  })
  it('handles booleans', () => {
    expect(isLiterally(true)(true)).toEqual(true)
    expect(isLiterally(true)(false)).toEqual(false)
  })
  it('handles literal strings instead of converting to basic types', () => {
    expect(isLiterally('string')('string')).toEqual(true)
    expect(isLiterally('string')('a')).toEqual(false)
  })
  it('handles multiple arguments', () => {
    expect(isLiterally('a', 1, true)('a')).toEqual(true)
    expect(isLiterally('a', 1, true)(1)).toEqual(true)
    expect(isLiterally('a', 1, true)(true)).toEqual(true)
    expect(isLiterally('a', 1, true)('b')).toEqual(false)
    expect(isLiterally('a', 1, true)(2)).toEqual(false)
    expect(isLiterally('a', 1, true)(false)).toEqual(false)
  })
})

describe('instanceOf', () => {
  it('gaurds constructor objects', () => {
    expect(isInstanceOf(Object)({})).toEqual(true)
    expect(isInstanceOf(String)('')).toEqual(false)
    expect(isInstanceOf(String)(String())).toEqual(false)
    expect(isInstanceOf(String)(new String())).toEqual(true)
    expect(isInstanceOf(Date)(new Date())).toEqual(true)
    expect(isInstanceOf(Date)(Date)).toEqual(false)
    expect(isInstanceOf(RegExp)(/0/)).toEqual(true)
    expect(isInstanceOf(Date).orInstanceOf(RegExp)(new Date())).toEqual(true)
    expect(isInstanceOf(Date).orInstanceOf(RegExp)(new RegExp('0'))).toEqual(true)
    class Person {}
    expect(isInstanceOf(Person)(new Person())).toEqual(true)
    expect(isInstanceOf(Person)(Person)).toEqual(false)
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

describe('requireThat', () => {
  it('requires types', () => {
    const isString = is('string')
    expect(() => requireThat(5, isString)).toThrowError("Type of '5' does not match type guard.")
    const isNumber = is('number')
    expect(() => requireThat(5, isNumber)).not.toThrow()
  })
  it('requires types with truncated preview in default error message', () => {
    const john = { id: 7, name: 'John' }
    const tim = {
      id: '7',
      name: 'Tim',
      age: 34,
      email: 'tim@example.com',
      isAdmin: false,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-04-24T12:00:00Z',
    }
    const isString = is('number')
    const isJohn = is({ id: 'number', name: 'string' })
    expect(() => requireThat(john, isString)).toThrowError(`Type of '{"id":7,"name":"John"}' does not match type guard.`)
    expect(() => requireThat(tim, isJohn)).toThrowError(
      `Type of '{"id":"7","name":"Tim","age":34,"email":"tim@example.com","isAdmin":false,"cr...' does not match type guard.`
    )
    expect(() => requireThat(john, isJohn)).not.toThrow()
  })
  it('requires types with custom error message', () => {
    const isString = is('string')
    expect(() => requireThat(5, isString, 'woops')).toThrowError('woops')
    const isNumber = is('number')
    expect(() => requireThat(5, isNumber)).not.toThrow()
  })
})

describe('and', () => {
  it('intersects types', () => {
    expect(is({ a: is('string') }).and({ b: is('number') })({ a: '', b: 0 })).toEqual(true)
  })
  it('intersects complex types', () => {
    const isA = is({ a: is('string') })
    const isB = is({ b: is('string') })
    const isC = is({ c: is('string') })
    const isD = is({ d: is('string') })
    const value1 = { a: '', b: '' }
    const value2 = { c: '' }
    const value3 = { c: '', d: '' }
    expect(isA.and(isB).or(isC)(value1)).toEqual(true)
    expect(isA.and(isB).or(isC)(value2)).toEqual(true)
    expect(isA.or(isB).and(isC)(value1)).toEqual(true)
    expect(isA.or(isB).and(isC)(value2)).toEqual(false)
    expect(isA.and(isB).or(isC).or(isD)(value2)).toEqual(true)
    expect(isA.and(isB).or(isC).and(isD)(value2)).toEqual(false)
    expect(isA.and(isB).or(isC).and(isD)(value3)).toEqual(true)
  })
})

describe('isOptional', () => {
  it('guards optional types', () => {
    expect(values.map(isOptional('any'))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(isOptional('boolean'))).toEqual([true, f, f, f, f, f, f, f, true])
    expect(values.map(isOptional('bigint'))).toEqual([f, true, f, f, f, f, f, f, true])
    expect(values.map(isOptional('function'))).toEqual([f, f, true, f, f, f, f, f, true])
    expect(values.map(isOptional('null'))).toEqual([f, f, f, true, f, f, f, f, true])
    expect(values.map(isOptional('number'))).toEqual([f, f, f, f, true, f, f, f, true])
    expect(values.map(isOptional('object'))).toEqual([f, f, f, true, f, true, f, f, true])
    expect(values.map(isOptional('string'))).toEqual([f, f, f, f, f, f, true, f, true])
    expect(values.map(isOptional('symbol'))).toEqual([f, f, f, f, f, f, f, true, true])
    expect(values.map(isOptional('undefined'))).toEqual([f, f, f, f, f, f, f, f, true])
    expect(values.map(isOptional('unknown'))).toEqual([true, true, true, true, true, true, true, true, true])
  })
})

describe('isNullable', () => {
  it('guards nullable types', () => {
    expect(values.map(isNullable('any'))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(isNullable('boolean'))).toEqual([true, f, f, true, f, f, f, f, f])
    expect(values.map(isNullable('bigint'))).toEqual([f, true, f, true, f, f, f, f, f])
    expect(values.map(isNullable('function'))).toEqual([f, f, true, true, f, f, f, f, f])
    expect(values.map(isNullable('null'))).toEqual([f, f, f, true, f, f, f, f, f])
    expect(values.map(isNullable('number'))).toEqual([f, f, f, true, true, f, f, f, f])
    expect(values.map(isNullable('object'))).toEqual([f, f, f, true, f, true, f, f, f])
    expect(values.map(isNullable('string'))).toEqual([f, f, f, true, f, f, true, f, f])
    expect(values.map(isNullable('symbol'))).toEqual([f, f, f, true, f, f, f, true, f])
    expect(values.map(isNullable('undefined'))).toEqual([f, f, f, true, f, f, f, f, true])
    expect(values.map(isNullable('unknown'))).toEqual([true, true, true, true, true, true, true, true, true])
  })
})

describe('isNullish', () => {
  it('guards nullish types', () => {
    expect(values.map(isNullish('any'))).toEqual([true, true, true, true, true, true, true, true, true])
    expect(values.map(isNullish('boolean'))).toEqual([true, f, f, true, f, f, f, f, true])
    expect(values.map(isNullish('bigint'))).toEqual([f, true, f, true, f, f, f, f, true])
    expect(values.map(isNullish('function'))).toEqual([f, f, true, true, f, f, f, f, true])
    expect(values.map(isNullish('null'))).toEqual([f, f, f, true, f, f, f, f, true])
    expect(values.map(isNullish('number'))).toEqual([f, f, f, true, true, f, f, f, true])
    expect(values.map(isNullish('object'))).toEqual([f, f, f, true, f, true, f, f, true])
    expect(values.map(isNullish('string'))).toEqual([f, f, f, true, f, f, true, f, true])
    expect(values.map(isNullish('symbol'))).toEqual([f, f, f, true, f, f, f, true, true])
    expect(values.map(isNullish('undefined'))).toEqual([f, f, f, true, f, f, f, f, true])
    expect(values.map(isNullish('unknown'))).toEqual([true, true, true, true, true, true, true, true, true])
  })
})
