type Literal = string | number | boolean
type Instance = new (...args: any[]) => any
type BasicTypeDef = `any` | `boolean` | `bigint` | `function` | `null` | `number` | `object` | `string` | `symbol` | `undefined` | `unknown`
interface ObjectTypeDef extends Record<PropertyKey, TypeDef> {}
// Nested TupleTypeDefs cause TypeScript errors, so deliberately not allowing that in the type.
type TupleTypeDef = [] | (BasicTypeDef | ObjectTypeDef | Guard<any>)[]
type TypeDef = BasicTypeDef | ObjectTypeDef | TupleTypeDef | Guard<any>

// Some constructor functions imply certain type constraints, e.g. 'isArrayOf' implies that the guard matches
// an array of the passed type definition. We need to remember these implied type definitions during validation,
// so internally, these type definitions are stored as a tuple [<implied_type_definition>, <passed_type_definition>].
// passed_type_definition is the argument the user passed to the constructor function, while implied_type_definition is
// indicated by one of the following markers:
const arrayMarker = `a`
const recordMarker = `r`
const literalMarker = `l`
const instanceMarker = `i`
const andMarker = `&`

type LiteralTypeDef = [typeof literalMarker, ...Literal[]]
type ArrayTypeDef = [typeof arrayMarker, TypeDef]
type RecordTypeDef = [typeof recordMarker, TypeDef]
type InstanceTypeDef = [typeof instanceMarker, Instance]
type AndTypeDef = [typeof andMarker, ...InternalTypeDef[]]
type InternalTypeDef = ArrayTypeDef | RecordTypeDef | LiteralTypeDef | InstanceTypeDef | AndTypeDef | TypeDef

// prettier-ignore
type BasicTypeDefType<T extends BasicTypeDef> =
    T extends `any` ? any
  : T extends `boolean` ? boolean
  : T extends `bigint` ? bigint
  : T extends `function` ? Function
  : T extends `null` ? null
  : T extends `number` ? number
  : T extends `object` ? object
  : T extends `string` ? string
  : T extends `symbol` ? symbol
  : T extends `undefined` ? undefined
  : T extends `unknown` ? unknown
  : never

type TypeDefType<TTypeDef extends unknown> = TTypeDef extends Guard<infer V>
  ? V
  : TTypeDef extends BasicTypeDef
  ? BasicTypeDefType<TTypeDef>
  : TTypeDef extends ObjectTypeDef | TupleTypeDef
  ? { [key in keyof TTypeDef]: TypeDefType<TTypeDef[key]> }
  : never

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

// prettier-ignore
const getBasicTypeGuard = (t: BasicTypeDef) => {
  switch (t) {
    case `any`: return (_: unknown): _ is any => true
    case `boolean`: return (v: unknown): v is boolean => typeof v === `boolean`
    case `bigint`: return (v: unknown): v is bigint => typeof v === `bigint`
    case `function`: return (v: unknown): v is Function => typeof v === 'function'
    case `null`: return (v: unknown): v is null => v === null
    case `number`: return (v: unknown): v is number => typeof v === `number`
    case `object`: return (v: unknown): v is object => typeof v === `object`
    case `string`: return (v: unknown): v is string => typeof v === `string`
    case `symbol`: return (v: unknown): v is symbol => typeof v === `symbol`
    case `undefined`: return (v: unknown): v is undefined => v === undefined
    case `unknown`: return (_: unknown): _ is unknown => true
  }
}

const isLiteralTypeGuard = (t: InternalTypeDef): t is LiteralTypeDef => Array.isArray(t) && t[0] === literalMarker
const isLiteralTypeValid = ([_, ...t]: LiteralTypeDef, value: unknown) => t.includes(value as Literal)

const isInstanceTypeGuard = (t: InternalTypeDef): t is InstanceTypeDef => Array.isArray(t) && t[0] === instanceMarker
const isInstanceTypeValid = ([_, t]: InstanceTypeDef, value: unknown) => value instanceof t

const isAndTypeGuard = (t: InternalTypeDef): t is AndTypeDef => Array.isArray(t) && t[0] === andMarker
const isAndTypeValid = ([_, ...t]: AndTypeDef, value: unknown) => t.every(g => isTypeValid(g, value))

const isArrayTypeGuard = (t: InternalTypeDef): t is ArrayTypeDef => Array.isArray(t) && t[0] === arrayMarker
const isArrayTypeValid = ([_, t]: ArrayTypeDef, value: unknown) => Array.isArray(value) && value.every((el: unknown) => isTypeValid(t, el))

const isTupleTypeValid = (t: TupleTypeDef, value: unknown) => Array.isArray(value) && t.every((g, i) => isTypeValid(g, value[i]))

const isRecordTypeGuard = (t: InternalTypeDef): t is RecordTypeDef => Array.isArray(t) && t[0] === recordMarker
const isRecordTypeValid = ([_, t]: RecordTypeDef, value: unknown) =>
  typeof value === `object` && value !== null && Object.values(value).every(v => isTypeValid(t, v))

const isObjectTypeValid = (t: unknown, value: unknown) =>
  typeof t === `object` &&
  t !== null &&
  typeof value === `object` &&
  value !== null &&
  Object.keys(t).every(k => isTypeValid((t as ObjectTypeDef)[k], (value as Record<PropertyKey, unknown>)[k]))

const isTypeValid = (t: InternalTypeDef, value: unknown): boolean => {
  try {
    // Basic type
    if (typeof t === `string`) return getBasicTypeGuard(t)(value)
    // Guard
    if (typeof t === 'function') return t(value)
    // Array
    if (isArrayTypeGuard(t)) return isArrayTypeValid(t, value)
    // Record
    if (isRecordTypeGuard(t)) return isRecordTypeValid(t, value)
    // Literal
    if (isLiteralTypeGuard(t)) return isLiteralTypeValid(t, value)
    // Instance
    if (isInstanceTypeGuard(t)) return isInstanceTypeValid(t, value)
    // And
    if (isAndTypeGuard(t)) return isAndTypeValid(t, value)
    // Tuple
    if (Array.isArray(t)) return isTupleTypeValid(t as TupleTypeDef, value)
    // Object
    return isObjectTypeValid(t, value)
  } catch {
    return false
  }
}

const createGuard = <T extends any>(guardDefinitions: InternalTypeDef[]) => {
  const guard: Guard<T> = (value: any): value is T => guardDefinitions.some(g => isTypeValid(g, value))
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

export const isBoolean = is(`boolean`)
export const isBigint = is(`bigint`)
export const isFunction = is(`function`)
export const isNull = is(`null`)
export const isNumber = is(`number`)
export const isString = is(`string`)
export const isSymbol = is(`symbol`)
export const isUndefined = is(`undefined`)
export const isBooleanOrNull = isBoolean.or(`null`)
export const isBigintOrNull = isBigint.or(`null`)
export const isFunctionOrNull = isFunction.or(`null`)
export const isNumberOrNull = isNumber.or(`null`)
export const isStringOrNull = isString.or(`null`)
export const isSymbolOrNull = isSymbol.or(`null`)
export const isBooleanOrUndefined = isBoolean.or(`undefined`)
export const isBigintOrUndefined = isBigint.or(`undefined`)
export const isFunctionOrUndefined = isFunction.or(`undefined`)
export const isNullOrUndefined = isNull.or(`undefined`)
export const isNumberOrUndefined = isNumber.or(`undefined`)
export const isStringOrUndefined = isString.or(`undefined`)
export const isSymbolOrUndefined = isSymbol.or(`undefined`)

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
  if (!guard(value)) throw new TypeError(errorMessage ?? `Type of '${value?.name ?? String(value)}' does not match type guard.`)
}

/** @deprecated Use requireThat instead */
export const assertThat = requireThat
