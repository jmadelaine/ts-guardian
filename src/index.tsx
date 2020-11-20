/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

type BasicType =
  | 'undefined'
  | 'null'
  | 'boolean'
  | 'number'
  | 'string'
  | 'symbol'
  | 'object'
  | 'array'
type ObjectKey = string | number

type Guard<T extends unknown> = ((input: unknown) => input is T) & {
  or: <U extends Type<unknown>>(t: U) => Guard<T | UnpackBasicType<U>>
}

type GuardOrGuardRecord<T> = T extends Record<ObjectKey, Guard<unknown>> ? GuardRecord<T> : Guard<T>
type GuardRecord<T extends Record<ObjectKey, Guard<unknown>>> = {
  [key in keyof T]: GuardOrGuardRecord<T[key]>
}
type Type<T extends unknown> = BasicType | Record<ObjectKey, GuardOrGuardRecord<T>>
type UnpackBasicType<T extends Type<unknown>> = T extends BasicType ? StringToBasicType<T> : T
type Unguard<T> = T extends Guard<infer V> ? V : never
type UnpackGuardRecordOrUnpackGuard<T> = T extends Record<ObjectKey, unknown>
  ? UnpackGuardRecord<T>
  : Unguard<T>
type UnpackGuardRecord<T extends Record<ObjectKey, unknown>> = {
  [key in keyof T]: UnpackGuardRecordOrUnpackGuard<T[key]>
}

type StringToBasicType<T extends BasicType> = T extends 'undefined'
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
  ? object
  : T extends 'array'
  ? unknown[]
  : never

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
      return (v: unknown): v is object => typeof v === 'object' && v !== null && !Array.isArray(v)
    case 'array':
      return (v: unknown): v is unknown[] => Array.isArray(v)
  }
}

const isOfShape = <T extends Record<ObjectKey, unknown>>(shape: T) => {
  const fn: any = (input: unknown): input is T => {
    if (!getBasicTypeCheckerFor('object')(input)) {
      return false
    }

    const areAllPropsPresent = Object.keys(shape).every(key => {
      const value = shape[key]
      if (typeof value === 'function') {
        return key in (input as any) && value((input as any)[key])
      } else if (getBasicTypeCheckerFor('object')(value)) {
        return isOfShape(value as any)((input as any)[key])
      }
    })
    return areAllPropsPresent
  }

  return fn as Guard<UnpackGuardRecord<T>>
}

const createReturnFunc = <T extends unknown>(orTypes: Type<unknown>[]) => {
  const returnFunc: Guard<T> = (input: unknown): input is T => {
    const doSomeTypesMatch = orTypes.some(orType => {
      if (typeof orType === 'string') {
        return getBasicTypeCheckerFor(orType)(input)
      } else {
        return isOfShape(orType)(input)
      }
    })
    return doSomeTypesMatch
  }

  returnFunc.or = createOr<T>(orTypes)

  return (returnFunc as unknown) as Guard<T>
}

const createOr = <TPrev extends unknown>(orTypes: Type<unknown>[]) => <TNew extends Type<unknown>>(
  t: TNew
): Guard<TPrev | UnpackBasicType<TNew>> => {
  orTypes.push(t)
  return createReturnFunc<TPrev | UnpackBasicType<TNew>>(orTypes)
}

export const is = <T extends Type<unknown>>(t: T): Guard<UnpackBasicType<T>> => {
  const orTypes: Type<unknown>[] = []
  orTypes.push(t)
  return createReturnFunc<UnpackBasicType<T>>(orTypes)
}
