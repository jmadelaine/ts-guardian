type BasicType =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'symbol'
  | 'object'
  | 'array'

type UnpackBasicType<T extends BasicType> = T extends 'undefined'
  ? undefined
  : T extends 'null'
  ? null
  : T extends 'boolean'
  ? boolean
  : T extends 'number'
  ? number
  : T extends 'string'
  ? string
  : T extends 'symbol'
  ? symbol
  : T extends 'object'
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    object
  : T extends 'array'
  ? unknown[]
  : never

type GuardRecordKey = string | number
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface GuardRecord extends Record<GuardRecordKey, GuardRecord | Guard<unknown>> {}
type Type = BasicType | GuardRecord
type UnpackType<T extends unknown> = T extends BasicType
  ? UnpackBasicType<T>
  : T extends GuardRecord
  ? { [key in keyof T]: UnpackType<T[key]> }
  : T extends Guard<infer V>
  ? V
  : never
type Guard<T extends unknown> = ((input: unknown) => input is T) & {
  or: <U extends Type>(t: U) => Guard<T | UnpackType<U>>
}

const getBasicTypeCheckerFor = (t: BasicType) => {
  switch (t) {
    case 'undefined':
      return (v: unknown): v is undefined => v === undefined
    case 'null':
      return (v: unknown): v is null => v === null
    case 'boolean':
      return (v: unknown): v is boolean => typeof v === 'boolean'
    case 'number':
      return (v: unknown): v is number => typeof v === 'number'
    case 'string':
      return (v: unknown): v is string => typeof v === 'string'
    case 'symbol':
      return (v: unknown): v is symbol => typeof v === 'symbol'
    case 'object':
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (v: unknown): v is object => typeof v === 'object' && v !== null && !Array.isArray(v)
    case 'array':
      return (v: unknown): v is unknown[] => Array.isArray(v)
  }
}

const isGuardRecordValid = <T extends GuardRecord>(guardRecord: T, input: unknown) => {
  if (getBasicTypeCheckerFor('object')(input)) {
    const guardRecordKeys = Object.keys(guardRecord)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const inputObj = input as Record<GuardRecordKey, unknown>

    for (const k of guardRecordKeys) {
      const value = guardRecord[k]

      if (typeof value === 'function') {
        // value is a Guard
        if (!value(inputObj)) {
          return false
        }
      } else {
        // Value must be a GuardRecord
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        if (!isGuardRecordValid(value as GuardRecord, inputObj)) {
          return false
        }
      }
    }
    return true
  }
  return false
}

const createGuard = <T extends unknown>(orTypes: Type[]) => {
  const guard: Guard<T> = (input: unknown): input is T => {
    const doSomeTypesMatch = orTypes.some(orType => {
      if (typeof orType === 'string') {
        return getBasicTypeCheckerFor(orType)(input)
      } else {
        return isGuardRecordValid(orType, input)
      }
    })
    return doSomeTypesMatch
  }

  guard.or = createOr<T>(orTypes)

  return guard
}

const createOr = <TPrev extends unknown>(orTypes: Type[]) => <TNew extends Type>(
  t: TNew
): Guard<TPrev | UnpackType<TNew>> => {
  orTypes.push(t)
  return createGuard<TPrev | UnpackType<TNew>>(orTypes)
}

export const is = <T extends Type>(t: T): Guard<UnpackType<T>> => {
  const orTypes: Type[] = []
  orTypes.push(t)
  return createGuard<UnpackType<T>>(orTypes)
}
