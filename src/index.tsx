type BasicType =
  | `any`
  | `boolean`
  | `bigint`
  | `function`
  | `null`
  | `number`
  | `object`
  | `string`
  | `symbol`
  | `undefined`
  | `unknown`

type WrappedLiteralType<T extends (string | number | boolean)[]> = ['l', T]
type EveryArrayElementType = ['a', BasicType | GuardRecord | GuardTuple | Guard<any>]
type AndGuardDefinitionType = ['&', ...GuardDefinition[]]
type InstanceGuardDefinitionType = ['i', new (...args: any[]) => any]
interface GuardRecord extends Record<PropertyKey, GuardRecord | GuardTuple | Guard<any>> {}
type GuardTuple = [] | (GuardRecord | Guard<any>)[]

// prettier-ignore
export type Guard<T extends unknown> = {
  (value: unknown): value is T
  or: <U extends BasicType | GuardRecord | Guard<any> | GuardTuple>(t: U) => Guard<T | UnpackType<U>>
  and: <U extends BasicType | GuardRecord | Guard<any> | GuardTuple>(t: U) => Guard<T & UnpackType<U>>
  orArrayOf: <U extends BasicType | GuardRecord | Guard<any> | GuardTuple>(t: U) => Guard<T | UnpackType<U>[]>
  orLiterally: <U extends (string | number | boolean)[]>(...t: U) => Guard<T | UnpackType<WrappedLiteralType<U>>>
  orInstanceOf: <U extends new (...args: any[]) => any>(t: U) => Guard<T | UnpackType<U>>
}

export type GuardType<T extends Guard<any>> = T extends (inp: unknown) => inp is infer U ? U : never

type GuardDefinition =
  | BasicType
  | WrappedLiteralType<(string | number | boolean)[]>
  | EveryArrayElementType
  | AndGuardDefinitionType
  | InstanceGuardDefinitionType
  | GuardRecord
  | GuardTuple
  | Guard<any>

// prettier-ignore
type UnpackBasicType<T extends BasicType> =
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

// prettier-ignore
type UnpackType<T extends unknown> =
    T extends BasicType ? UnpackBasicType<T>
  : T extends WrappedLiteralType<(string | number | boolean)[]> ? T[1][number]
  : T extends GuardRecord | GuardTuple ? { [key in keyof T]: UnpackType<T[key]> }
  : T extends Guard<infer V> ? V
  : T extends new (...args: any[]) => infer V ? V
  : never

const arrayMarker = `a`
const literalMarker = `l`
const andMarker = `&`
const instanceMarker = 'i'

// prettier-ignore
const getBasicTypeGuard = (t: BasicType) => {
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

const isTypeValid = (t: GuardDefinition, value: unknown): boolean => {
  // Basic type
  if (typeof t === `string`) return getBasicTypeGuard(t)(value)
  // Guard
  if (typeof t === 'function') return t(value)
  // Literal or And guard or Instance guard or Array or Tuple
  if (Array.isArray(t)) {
    // Literal
    if (t[0] === literalMarker) return (t[1] as unknown[]).includes(value)
    // Instance guard
    if (t[0] === instanceMarker) return value instanceof t[1]
    // And guard
    if (t[0] === andMarker) return t.slice(1).every(g => isTypeValid(g as GuardDefinition, value))
    if (!Array.isArray(value)) return false
    // Array
    if (t[0] === arrayMarker) return value.every(el => isTypeValid(t[1]!, el))
    // Tuple
    for (let i = 0; i < t.length; ++i) {
      if (!isTypeValid((t as any[])[i], value[i])) return false
    }
    return true
  }
  // Record
  if (typeof t === `object` && t !== null) {
    if (typeof value !== `object` || value === null) return false
    for (const k of Object.keys(t)) {
      if (!isTypeValid((t as GuardRecord)[k], (value as Record<PropertyKey, unknown>)[k]))
        return false
    }
    return true
  }
  return false
}

const createNameFromTypes = (guardDefinitions: GuardDefinition[], isAnd?: boolean) => {
  let name = ``
  for (let i = 0; i < guardDefinitions.length; ++i) {
    if (i > 0) name += isAnd ? ` & ` : ` | `
    const t = guardDefinitions[i]
    // Basic type
    if (typeof t === `string`) name += t
    // Guard
    else if (typeof t === `function`) name += t.name.slice(6, -1)
    // Literal or Array or Tuple
    else if (Array.isArray(t)) {
      // Literal
      if (t[0] === literalMarker)
        name += t[1].map(tt => (typeof tt === 'string' ? `"${tt}"` : tt)).join(' | ')
      // Instance guard
      else if (t[0] === instanceMarker) name += t[1].name
      // And guard
      else if (t[0] === andMarker)
        name += createNameFromTypes(t.slice(1) as GuardDefinition[], true)
      // Array
      else if (t[0] === arrayMarker) {
        const elTypeNames = createNameFromTypes([t[1]]).slice(6, -1)
        const useParentheses = elTypeNames.includes(`|`)
        name += `${useParentheses ? `(` : ``}${elTypeNames}${useParentheses ? `)` : ``}[]`
      }
      // Tuple
      else name += `[` + t.map(el => createNameFromTypes([el]).slice(6, -1)).join(`, `) + `]`
    }
    // Record
    else name += `{}`
  }
  return isAnd ? name : `Guard<${name}>`
}

const createGuard = <T extends any>(guardDefinitions: GuardDefinition[]) => {
  const guard: Guard<T> = (value: any): value is T =>
    guardDefinitions.some(guardDef => isTypeValid(guardDef, value))
  Object.defineProperty(guard, `name`, { value: createNameFromTypes(guardDefinitions) })
  guard.or = createOr<T>(guardDefinitions)
  guard.orArrayOf = createOrArrayOf<T>(guardDefinitions)
  guard.orLiterally = createOrLiterally<T>(guardDefinitions)
  guard.orInstanceOf = createOrInstanceOf<T>(guardDefinitions)
  guard.and = createAnd<T>(guardDefinitions)
  return guard
}

const createOr =
  <TPrev extends any>(prevGuardDefinitions: GuardDefinition[]) =>
  <TNew extends BasicType | GuardRecord | GuardTuple | Guard<any>>(
    t: TNew
  ): Guard<TPrev | UnpackType<TNew>> =>
    createGuard<TPrev | UnpackType<TNew>>([...prevGuardDefinitions, t])

const createAnd =
  <TPrev extends any>(prevGuardDefinitions: GuardDefinition[]) =>
  <TNew extends BasicType | GuardRecord | GuardTuple | Guard<any>>(
    t: TNew
  ): Guard<TPrev & UnpackType<TNew>> => {
    const lastGuardDef = prevGuardDefinitions.slice(-1)[0]
    return createGuard<TPrev & UnpackType<TNew>>([
      ...prevGuardDefinitions.slice(0, -1),
      Array.isArray(lastGuardDef) && lastGuardDef[0] === andMarker
        ? [...lastGuardDef, t]
        : [andMarker, lastGuardDef, t],
    ])
  }

const createOrArrayOf =
  <TPrev extends any>(prevGuardDefinitions: GuardDefinition[]) =>
  <TNew extends BasicType | GuardRecord | GuardTuple | Guard<any>>(
    t: TNew
  ): Guard<TPrev | UnpackType<TNew>[]> =>
    createGuard<TPrev | UnpackType<TNew>[]>([...prevGuardDefinitions, [arrayMarker, t]])

const createOrLiterally =
  <TPrev extends any>(prevGuardDefinitions: GuardDefinition[]) =>
  <TNew extends (string | number | boolean)[]>(
    ...t: TNew
  ): Guard<TPrev | UnpackType<WrappedLiteralType<TNew>>> =>
    createGuard<TPrev | UnpackType<WrappedLiteralType<TNew>>>([
      ...prevGuardDefinitions,
      [literalMarker, t],
    ])

const createOrInstanceOf =
  <TPrev extends any>(prevGuardDefinitions: GuardDefinition[]) =>
  <TNew extends new (...args: any[]) => any>(t: TNew): Guard<TPrev | UnpackType<TNew>> =>
    createGuard<TPrev | UnpackType<TNew>>([...prevGuardDefinitions, [instanceMarker, t]])

export const is = <T extends BasicType | GuardRecord | GuardTuple | Guard<any>>(
  t: T
): Guard<UnpackType<T>> => createGuard<UnpackType<T>>([t])

export const isArrayOf = <T extends BasicType | GuardRecord | GuardTuple | Guard<any>>(
  t: T
): Guard<UnpackType<T>[]> => createGuard<UnpackType<T>[]>([[arrayMarker, t]])

export const isLiterally = <T extends (string | number | boolean)[]>(
  ...t: T
): Guard<UnpackType<WrappedLiteralType<T>>> =>
  createGuard<UnpackType<WrappedLiteralType<T>>>([[literalMarker, t]])

export const isInstanceOf = <T extends new (...args: any[]) => any>(t: T) =>
  createGuard<UnpackType<T>>([[instanceMarker, t]])

export const isBoolean = is(`boolean`)
export const isBigint = is(`bigint`)
export const isDate = isInstanceOf(Date)
export const isFunction = is(`function`)
export const isNull = is(`null`)
export const isNumber = is(`number`)
export const isRegExp = isInstanceOf(RegExp)
export const isString = is(`string`)
export const isSymbol = is(`symbol`)
export const isUndefined = is(`undefined`)
export const isBooleanOrNull = isBoolean.or(`null`)
export const isBigintOrNull = isBigint.or(`null`)
export const isDateOrNull = isDate.or('null')
export const isFunctionOrNull = isFunction.or(`null`)
export const isNumberOrNull = isNumber.or(`null`)
export const isRegExpOrNull = isRegExp.or('null')
export const isStringOrNull = isString.or(`null`)
export const isSymbolOrNull = isSymbol.or(`null`)
export const isBooleanOrUndefined = isBoolean.or(`undefined`)
export const isBigintOrUndefined = isBigint.or(`undefined`)
export const isDateOrUndefined = isDate.or('undefined')
export const isFunctionOrUndefined = isFunction.or(`undefined`)
export const isNullOrUndefined = isNull.or(`undefined`)
export const isNumberOrUndefined = isNumber.or(`undefined`)
export const isRegExpOrUndefined = isRegExp.or('undefined')
export const isStringOrUndefined = isString.or(`undefined`)
export const isSymbolOrUndefined = isSymbol.or(`undefined`)

export const parserFor =
  <T extends any = undefined, TGuard extends Guard<any> = Guard<T>>(guard: TGuard) =>
  (
    value: any
  ): T extends undefined
    ? GuardType<TGuard> | undefined
    : GuardType<TGuard> extends T
    ? T | undefined
    : never =>
    guard(value) ? value : undefined

export const assertThat: <T extends any>(
  value: any,
  guard: Guard<T>,
  errorMessage?: string
) => asserts value is T = <T extends any>(value: any, guard: Guard<T>, errorMessage?: string) => {
  if (!guard(value)) {
    throw new TypeError(
      errorMessage ??
        `Type of '${value?.name ?? String(value)}' does not match type guard '${guard.name}'.`
    )
  }
}
