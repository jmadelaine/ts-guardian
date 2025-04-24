type BasicTypeMap = {
  any: any
  boolean: boolean
  bigint: bigint
  function: Function
  null: null
  number: number
  object: object
  string: string
  symbol: symbol
  undefined: undefined
  unknown: unknown
}
type BasicTypeDef = keyof BasicTypeMap
type BasicArrayTypeDef = `${BasicTypeDef}[]`
type BasicOptionalTypeDef = `${Exclude<BasicTypeDef | BasicArrayTypeDef, 'undefined' | 'unknown' | 'any'>}?`
type Literal = string | number | boolean
type Instance = new (...args: any[]) => any
interface ObjectTypeDef extends Record<PropertyKey, TypeDef> {}
// Nested TupleTypeDefs cause TypeScript errors, so deliberately not allowing that in the type.
type TupleTypeDef = [] | (BasicTypeDef | BasicArrayTypeDef | BasicOptionalTypeDef | ObjectTypeDef | Guard<any>)[]
type TypeDef = BasicTypeDef | BasicArrayTypeDef | BasicOptionalTypeDef | ObjectTypeDef | TupleTypeDef | Guard<any>
type BasicTypeDefType<T extends BasicTypeDef> = BasicTypeMap[T]
type StripArrayBrackets<T extends string> = T extends `${infer U}[]` ? U : never
type StripOptionalMark<T extends string> = T extends `${infer U}?` ? U : never
type TypeDefType<TTypeDef extends unknown> = TTypeDef extends Guard<infer V>
  ? V
  : TTypeDef extends BasicTypeDef
  ? BasicTypeDefType<TTypeDef>
  : TTypeDef extends BasicArrayTypeDef
  ? BasicTypeDefType<StripArrayBrackets<TTypeDef>>[]
  : TTypeDef extends BasicOptionalTypeDef
  ?
      | (StripOptionalMark<TTypeDef> extends infer Stripped
          ? Stripped extends BasicArrayTypeDef
            ? BasicTypeDefType<StripArrayBrackets<Stripped>>[]
            : Stripped extends BasicTypeDef
            ? BasicTypeDefType<Stripped>
            : never
          : never)
      | undefined
  : TTypeDef extends ObjectTypeDef | TupleTypeDef
  ? { [key in keyof TTypeDef]: TypeDefType<TTypeDef[key]> }
  : never

// Some functions imply a type (e.g. 'isArrayOf' implies an array).
// Internally, we store type defs as [impliedType, passedType].
// `passedType` is what the user provided; `impliedType` is inferred via a marker.
const arrayMarker = 'a'
const recordMarker = 'r'
const literalMarker = 'l'
const instanceMarker = 'i'
const andMarker = '&'
type LiteralTypeDef = [typeof literalMarker, ...Literal[]]
type ArrayTypeDef = [typeof arrayMarker, TypeDef]
type RecordTypeDef = [typeof recordMarker, TypeDef]
type InstanceTypeDef = [typeof instanceMarker, Instance]
type AndTypeDef = [typeof andMarker, ...InternalTypeDef[]]
type InternalTypeDef = ArrayTypeDef | RecordTypeDef | LiteralTypeDef | InstanceTypeDef | AndTypeDef | TypeDef

export type Guard<T extends unknown> = {
  (value: unknown): value is T
  or: <U extends TypeDef>(t: U) => Guard<T | TypeDefType<U>>
  and: <U extends TypeDef>(t: U) => Guard<T & TypeDefType<U>>
  orArrayOf: <U extends TypeDef>(t: U) => Guard<T | TypeDefType<U>[]>
  orRecordOf: <U extends TypeDef>(t: U) => Guard<T | Record<PropertyKey, TypeDefType<U>>>
  orLiterally: <U extends Literal[]>(...t: U) => Guard<T | U[number]>
  orInstanceOf: <U extends Instance>(t: U) => Guard<T | (U extends new (...args: any[]) => infer V ? V : never)>
}

export type GuardType<T extends Guard<any>> = T extends (value: unknown) => value is infer U ? U : never

const anyGuard = (_: unknown): _ is any => true
const booleanGuard = (v: unknown): v is boolean => typeof v === 'boolean'
const bigintGuard = (v: unknown): v is bigint => typeof v === 'bigint'
const functionGuard = (v: unknown): v is Function => typeof v === 'function'
const nullGuard = (v: unknown): v is null => v === null
const numberGuard = (v: unknown): v is number => typeof v === 'number'
const objectGuard = (v: unknown): v is object => typeof v === 'object'
const stringGuard = (v: unknown): v is string => typeof v === 'string'
const symbolGuard = (v: unknown): v is symbol => typeof v === 'symbol'
const undefinedGuard = (v: unknown): v is undefined => v === undefined
const unknownGuard = (_: unknown): _ is unknown => true
const isLiteralTypeDef = (t: InternalTypeDef): t is LiteralTypeDef => Array.isArray(t) && t[0] === literalMarker
const literalGuard = ([_, ...t]: LiteralTypeDef, value: unknown) => t.includes(value as Literal)
const isInstanceTypeDef = (t: InternalTypeDef): t is InstanceTypeDef => Array.isArray(t) && t[0] === instanceMarker
const instanceGuard = ([_, t]: InstanceTypeDef, value: unknown) => value instanceof t
const isAndTypeDef = (t: InternalTypeDef): t is AndTypeDef => Array.isArray(t) && t[0] === andMarker
const andGuard = ([_, ...t]: AndTypeDef, value: unknown) => t.every(g => mainGuard(g, value))
const isArrayTypeDef = (t: InternalTypeDef): t is ArrayTypeDef => Array.isArray(t) && t[0] === arrayMarker
const arrayGuard = ([_, t]: ArrayTypeDef, value: unknown) => Array.isArray(value) && value.every((el: unknown) => mainGuard(t, el))
const tupleGuard = (t: TupleTypeDef, value: unknown) => Array.isArray(value) && t.every((g, i) => mainGuard(g, value[i]))
const isRecordTypeDef = (t: InternalTypeDef): t is RecordTypeDef => Array.isArray(t) && t[0] === recordMarker
const recordGuard = ([_, t]: RecordTypeDef, value: unknown) =>
  typeof value === 'object' && value !== null && Object.values(value).every(v => mainGuard(t, v))
const curlyObjectGuard = (t: ObjectTypeDef, value: unknown) =>
  typeof t === 'object' &&
  t !== null &&
  typeof value === 'object' &&
  value !== null &&
  Object.keys(t).every(k => mainGuard(t[k], (value as { [key: string]: unknown })[k]))

const mainGuard = (t: InternalTypeDef, value: unknown): boolean => {
  try {
    if (typeof t === 'string') {
      if (t.endsWith('[]')) return arrayGuard(['a', t.slice(0, -2) as TypeDef], value) // Basic array type
      if (t.endsWith('?')) return mainGuard(t.slice(0, -1) as TypeDef, value) || undefinedGuard(value) // Basic optional type
      // prettier-ignore
      // Basic type
      switch (t) {
        case 'any': return anyGuard(value)
        case 'boolean': return booleanGuard(value)
        case 'bigint': return bigintGuard(value)
        case 'function': return functionGuard(value)
        case 'null': return nullGuard(value)
        case 'number': return numberGuard(value)
        case 'object': return objectGuard(value)
        case 'string': return stringGuard(value)
        case 'symbol': return symbolGuard(value)
        case 'undefined': return undefinedGuard(value)
        case 'unknown': return unknownGuard(value)
        default: return false
      }
    }
    if (typeof t === 'function') return t(value) // Guard
    if (isArrayTypeDef(t)) return arrayGuard(t, value) // Array
    if (isRecordTypeDef(t)) return recordGuard(t, value) // Record
    if (isLiteralTypeDef(t)) return literalGuard(t, value) // Literal
    if (isInstanceTypeDef(t)) return instanceGuard(t, value) // Instance
    if (isAndTypeDef(t)) return andGuard(t, value) // And
    if (Array.isArray(t)) return tupleGuard(t, value) // Tuple
    return curlyObjectGuard(t, value) // Object
  } catch {
    return false
  }
}

const createGuard = <T extends any>(guardDefinitions: InternalTypeDef[]) => {
  const guard: Guard<T> = (value: any): value is T => guardDefinitions.some(g => mainGuard(g, value))
  guard.or = createOr<T>(guardDefinitions)
  guard.orArrayOf = createOrArrayOf<T>(guardDefinitions)
  guard.orRecordOf = createOrRecordOf<T>(guardDefinitions)
  guard.orLiterally = createOrLiterally<T>(guardDefinitions)
  guard.orInstanceOf = createOrInstanceOf<T>(guardDefinitions)
  guard.and = createAnd<T>(guardDefinitions)
  return guard
}

const createOr =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends TypeDef>(t: TNew) =>
    createGuard<TPrev | TypeDefType<TNew>>([...prevTypeDefinitions, t])

const createAnd =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends TypeDef>(t: TNew) => {
    const lastGuardDef = prevTypeDefinitions.slice(-1)[0]
    return createGuard<TPrev & TypeDefType<TNew>>([
      ...prevTypeDefinitions.slice(0, -1),
      Array.isArray(lastGuardDef) && lastGuardDef[0] === andMarker ? [...lastGuardDef, t] : [andMarker, lastGuardDef, t],
    ])
  }

const createOrArrayOf =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends TypeDef>(t: TNew) =>
    createGuard<TPrev | TypeDefType<TNew>[]>([...prevTypeDefinitions, [arrayMarker, t]])

const createOrRecordOf =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends TypeDef>(t: TNew) =>
    createGuard<TPrev | Record<PropertyKey, TypeDefType<TNew>>>([...prevTypeDefinitions, [recordMarker, t]])

const createOrLiterally =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends Literal[]>(...t: TNew) =>
    createGuard<TPrev | TNew[number]>([...prevTypeDefinitions, [literalMarker, ...t]])

const createOrInstanceOf =
  <TPrev extends any>(prevTypeDefinitions: InternalTypeDef[]) =>
  <TNew extends new (...args: any[]) => any>(t: TNew) =>
    createGuard<TPrev | (TNew extends new (...args: any[]) => infer V ? V : never)>([...prevTypeDefinitions, [instanceMarker, t]])

export const is = <T extends TypeDef>(t: T) => createGuard<TypeDefType<T>>([t])
export const isArrayOf = <T extends TypeDef>(t: T) => createGuard<TypeDefType<T>[]>([[arrayMarker, t]])
export const isRecordOf = <T extends TypeDef>(t: T) => createGuard<Record<PropertyKey, TypeDefType<T>>>([[recordMarker, t]])
export const isLiterally = <T extends Literal[]>(...t: T) => createGuard<T[number]>([[literalMarker, ...t]])
export const isInstanceOf = <T extends Instance>(t: T) =>
  createGuard<T extends new (...args: any[]) => infer V ? V : never>([[instanceMarker, t]])

export const isOptional = <T extends TypeDef>(t: T) => createGuard<TypeDefType<T> | undefined>([t, 'undefined'])
export const isNullable = <T extends TypeDef>(t: T) => createGuard<TypeDefType<T> | null>([t, 'null'])
export const isNullish = <T extends TypeDef>(t: T) => createGuard<TypeDefType<T> | null | undefined>([t, 'null', 'undefined'])

/** @deprecated Use `is('boolean')` instead. */
export const isBoolean = is('boolean')
/** @deprecated Use `is('bigint')` instead. */
export const isBigint = is('bigint')
/** @deprecated Use `is('function')` instead. */
export const isFunction = is('function')
/** @deprecated Use `is('null')` instead. */
export const isNull = is('null')
/** @deprecated Use `is('number')` instead. */
export const isNumber = is('number')
/** @deprecated Use `is('string')` instead. */
export const isString = is('string')
/** @deprecated Use `is('symbol')` instead. */
export const isSymbol = is('symbol')
/** @deprecated Use `is('undefined')` instead. */
export const isUndefined = is('undefined')
/** @deprecated Use `isNullable('boolean')` instead. */
export const isBooleanOrNull = isNullable('boolean')
/** @deprecated Use `isNullable('bigint')` instead. */
export const isBigintOrNull = isNullable('bigint')
/** @deprecated Use `isNullable('function')` instead. */
export const isFunctionOrNull = isNullable('function')
/** @deprecated Use `isNullable('number')` instead. */
export const isNumberOrNull = isNullable('number')
/** @deprecated Use `isNullable('string')` instead. */
export const isStringOrNull = isNullable('string')
/** @deprecated Use `isNullable('symbol')` instead. */
export const isSymbolOrNull = isNullable('symbol')
/** @deprecated Use `is('boolean?')` instead. */
export const isBooleanOrUndefined = is('boolean?')
/** @deprecated Use `is('bigint?')` instead. */
export const isBigintOrUndefined = is('bigint?')
/** @deprecated Use `is('function?')` instead. */
export const isFunctionOrUndefined = is('function?')
/** @deprecated Use `is('null?')` instead. */
export const isNullOrUndefined = is('null?')
/** @deprecated Use `is('number?')` instead. */
export const isNumberOrUndefined = is('number?')
/** @deprecated Use `is('string?')` instead. */
export const isStringOrUndefined = is('string?')
/** @deprecated Use `is('symbol?')` instead. */
export const isSymbolOrUndefined = is('symbol?')

type ParserReturn<T, TGuard extends Guard<any>> = T extends undefined
  ? GuardType<TGuard> | undefined
  : GuardType<TGuard> extends T
  ? T | undefined
  : never

export const parserFor =
  <T extends any = undefined, TGuard extends Guard<any> = Guard<T>>(guard: TGuard) =>
  (value: any): ParserReturn<T, TGuard> =>
    guard(value) ? value : (undefined as ParserReturn<T, TGuard>)

export const requireThat: <T extends any>(value: any, guard: Guard<T>, errorMessage?: string) => asserts value is T = <T extends any>(
  value: any,
  guard: Guard<T>,
  errorMessage?: string
) => {
  if (!guard(value)) {
    if (errorMessage) throw new TypeError(errorMessage)
    let preview: string
    try {
      preview = JSON.stringify(value)
    } catch {
      try {
        preview = String(value)
      } catch {
        preview = '[unknown value]'
      }
    }
    if (preview.length > 80) preview = preview.slice(0, 77) + '...'
    throw new TypeError(`Type of '${preview}' does not match type guard.`)
  }
}

/** @deprecated Use requireThat instead */
export const assertThat = requireThat
