type BasicType =
  | 'array'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'symbol'
  | 'undefined'

type UnpackBasicType<T extends BasicType> = T extends 'array'
  ? unknown[]
  : T extends 'boolean'
  ? boolean
  : T extends 'function'
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    Function
  : T extends 'null'
  ? null
  : T extends 'number'
  ? number
  : T extends 'object'
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    object
  : T extends 'string'
  ? string
  : T extends 'symbol'
  ? symbol
  : T extends 'undefined'
  ? undefined
  : never

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GuardRecord extends Record<PropertyKey, GuardRecord | Guard<unknown>> {}

type Guard<T extends unknown> = ((input: unknown) => input is T) & {
  or: <U extends BasicType | GuardRecord | Guard<unknown>>(t: U) => Guard<T | UnpackType<U>>
}

type UnpackType<T extends unknown> = T extends BasicType
  ? UnpackBasicType<T>
  : T extends GuardRecord
  ? { [key in keyof T]: UnpackType<T[key]> }
  : T extends Guard<infer V>
  ? V
  : never

const getBasicTypeCheckerFor = (t: BasicType) => {
  switch (t) {
    case 'array':
      return (v: unknown): v is unknown[] => Array.isArray(v)
    case 'boolean':
      return (v: unknown): v is boolean => typeof v === 'boolean'
    case 'function':
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (v: unknown): v is Function => typeof v === 'function'
    case 'null':
      return (v: unknown): v is null => v === null
    case 'number':
      return (v: unknown): v is number => typeof v === 'number'
    case 'object':
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (v: unknown): v is object => typeof v === 'object' && v !== null && !Array.isArray(v)
    case 'string':
      return (v: unknown): v is string => typeof v === 'string'
    case 'symbol':
      return (v: unknown): v is symbol => typeof v === 'symbol'
    case 'undefined':
      return (v: unknown): v is undefined => v === undefined
  }
}

const isGuardRecordValid = <T extends GuardRecord>(guardRecord: T, input: unknown) => {
  if (typeof input !== 'object' || input === null) {
    return false
  }
  const guardRecordKeys = Object.keys(guardRecord)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const inputObj = input as Record<PropertyKey, unknown>
  for (const k of guardRecordKeys) {
    const value = guardRecord[k]
    if (typeof value === 'function') {
      if (!value(inputObj[k])) {
        return false
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    } else if (!isGuardRecordValid(value as GuardRecord, inputObj[k])) {
      return false
    }
  }
  return true
}

const createGuard = <T extends unknown>(orTypes: (BasicType | GuardRecord | Guard<unknown>)[]) => {
  const guard: Guard<T> = (input: unknown): input is T =>
    orTypes.some(orType => {
      if (typeof orType === 'string') {
        return getBasicTypeCheckerFor(orType)(input)
      }
      if (typeof orType === 'function') {
        return orType(input)
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return isGuardRecordValid(orType as GuardRecord, input)
    })
  guard.or = createOr<T>(orTypes)
  return guard
}

const createOr = <TPrev extends unknown>(orTypes: (BasicType | GuardRecord | Guard<unknown>)[]) => <
  TNew extends BasicType | GuardRecord | Guard<unknown>
>(
  t: TNew
): Guard<TPrev | UnpackType<TNew>> => {
  orTypes.push(t)
  return createGuard<TPrev | UnpackType<TNew>>(orTypes)
}

export const is = <T extends BasicType | GuardRecord | Guard<unknown>>(
  t: T
): Guard<UnpackType<T>> => {
  const orTypes: (BasicType | GuardRecord | Guard<unknown>)[] = [t]
  return createGuard<UnpackType<T>>(orTypes)
}

export const isArray = is('array')
export const isBoolean = is('boolean')
export const isFunction = is('function')
export const isNull = is('null')
export const isNumber = is('number')
export const isObject = is('object')
export const isString = is('string')
export const isSymbol = is('symbol')
export const isUndefined = is('undefined')

export const isArrayOrUndefined = is('array').or('undefined')
export const isBooleanOrUndefined = is('boolean').or('undefined')
export const isFunctionOrUndefined = is('function').or('undefined')
export const isNullOrUndefined = is('null').or('undefined')
export const isNumberOrUndefined = is('number').or('undefined')
export const isObjectOrUndefined = is('object').or('undefined')
export const isStringOrUndefined = is('string').or('undefined')
export const isSymbolOrUndefined = is('symbol').or('undefined')
