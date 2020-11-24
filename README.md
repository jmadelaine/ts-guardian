[![Unlicense license][license-badge]][license]
[![NPM version][npm-badge]][npm]

# ts-guardian

## Introduction

Type guards you can trust! 👍

TS Guardian uses the power of [TypeScript][typescript] and [functional programming][functional-programming] to protect your data types, so rest easy.

<br />

## Index

- [Quick start](#quick-start)
- [Installation](#installation)
- [Reliable type guards](#reliable-type-guards)
- [The `is` and `or` functions](#the-is-and-or-functions)
- [The `isArray` and `orArray` functions](#the-is-array-and-or-array-functions)
- [Basic guards](#basic-guards)
- [Guard objects](#guard-objects)
- [Guard tuples](#guard-tuples)
- [Guard chaining](#guard-chaining)
- [Guard composition](#guard-composition)
- [Convenience guards](#convenience-guards)

<br />

## Quick start

```ts
// Import the `is` function
import { is } from 'ts-guardian'

// We want to determine the type of `value` returned from `getSomeValue`
const value = getSomeValue()

//
// Basic type guard
//

const isString = is('string')

if (isString(value)) {
  // value is of type `string`
  const lower = value.toLowerCase()
}

//
// Multiple types
//

const isNullish = is('null').or('undefined')

if (isNullish(value)) {
  // value is of type `null | undefined`
  throw new Error('missing value')
}

//
// Composable
//

const isId = isString.or('number')

if (isId(value)) {
  // value is of type `string | number`
  const id = value
}

//
// Object type guards
//

const hasMessage = is({ message: is('string') })

if (hasMessage(value)) {
  // value is of type `{ message: string }`
  const message = value.message
}

//
// Tuple type guards
//

const isLabelledCoordinate = is([is('string'), is('number'), is('number')])

if (isLabelledCoordinate(value)) {
  // value is of type `[string, number, number]`
  const [label, x, y] = value
}

//
// Safe (no type predicates or assertions required)
//

type Contact = {
  name: string
  email: string | undefined
  phone: string | number | undefined
}

const isStringOrUndefined = isString.or('undefined')

const isContact = is({
  name: isString,
  email: isStringOrUndefined,
  phone: isStringOrUndefined.or('number'),
})

if (isContact(value)) {
  /* value is of type:
      {
        name: string;
        email: string | undefined;
        phone: string | number | undefined
      }
  */
  const contact: Contact = value
}
```

<br />

## Reliable type guards

`ts-guardian` solves the problem of reliable type guards in a concise, composable, and human-readable way.

Consider the following problem:

### Problem

We fetch some data from an API. We expect the data to contain information about the current user. How can we guarantee the data is of the correct `User` type before we use it in our app?

Here is our `User` type:

```ts
type User = {
  id: number
  name: string
  email?: string
  phone?: {
    primary?: string
    secondary?: string
  }
}
```

### Solution 1 - User-defined type guards 👎

With TypeScript's [user-defined type guards][user-defined-type-guards], we could write an `isUser` function to confirm a value is of type `User`. It would probably look something like this:

```ts
// Returns user-defined type guard `input is User`
const isUser = (input: unknown): input is User => {
  const u = input as User
  return (
    typeof u === 'object' &&
    u !== null &&
    typeof u.id === 'number' &&
    typeof u.name === 'string' &&
    (typeof u.email === 'string' || u.email === undefined) &&
    ((typeof u.phone === 'object' &&
      u.phone !== null &&
      (typeof u.phone.primary === 'string' || u.phone.primary === undefined) &&
      (typeof u.phone.secondary === 'string' || u.phone.secondary === undefined)) ||
      u.phone === undefined)
  )
}

// Returns `input` if considered of type `User` by `isUser`, otherwise returns `undefined`
const parseUser = (input: unknown): User | undefined => {
  return isUser(input) ? input : undefined
}
```

Not pretty, but it works!

Apart from being hard to read and harder to reason about, this function seems to get the job done. We have type safety around the `User` type. Great!

Oh, but what if we did this instead:

```ts
const isUser = (input: unknown): input is User => {
  return typeof input === 'object'
}
```

Clearly this function is not enough to confirm that `input` is of type `User`, but TypeScript doesn't complain at all, because...

_Type predicates are effectively type assertions._

By saying to TypeScript "if I return `true`, consider `input` to be of type `User`", we lose type safety, and introduce potential **runtime errors** into our app. 😫

There is no connection between the result of `isUser` and the compatibility of the type of `input` with the `User` type, other than the assumption that our (obviously error-free) boolean logic accurately defines the type we are asserting. Sounds reliable.

_So how can we **guarantee** that a value is compatible with our user-defined type?_

Let's try something else...

### Solution 2 - Primitive-based type guards 👍

The solution is simple:

_We make no assumptions that the value is a user-defined type._

Instead, we define a **primitive-based type** of what a `User` object looks like, and let TypeScript determine whether this **primitive-based type** is compatible with the `User` type:

> A _primitive-based type_ is a type constructed from only primitve TypeScript types (`string`, `number`, `undefined`, `any`, etc...).

```ts
import { is } from 'ts-guardian'

// We make no assumptions that the data is a user-defined type
const isUser = is({
  id: is('number'),
  name: is('string'),
  email: is('string').or('undefined'),
  phone: is('undefined').or({
    primary: is('string').or('undefined'),
    secondary: is('string').or('undefined'),
  }),
})
```

Instead of `isUser` returning the type predicate `input is User`, it now returns a type predicate that gets auto-generated from our type checking, which in this case looks like:

```ts
// Type predicate for our primitive-based type
input is {
    id: number;
    name: string;
    email: string | undefined;
    phone: {
        primary: string | undefined;
        secondary: string | undefined;
    } | undefined;
}
```

It's now up to TypeScript to tell us if this type is compatible with the `User` type:

```ts
// TypeScript complains if the primitive-based type is not compatible with User
const parseUser = (input: unknown): User | undefined => {
  return isUser(input) ? input : undefined
}
```

In `parseUser`, if the type predicate from `isUser` is not compatible with the `User` type, then we get a TypeScript compiler error telling us this. 🎉

Not only that, but the syntax is clean, concise, and readable. Double thumbs up! 👍 👍

<br />

## Installation

```
npm i ts-guardian
```

<br />

## The `is` and `or` functions

### `is`

`ts-guardian` exports the `is` function, which is a curried function used to build type guards. The `is` function takes a parameter used to define a type, and returns a type guard for that type:

```ts
// The `is` function looks something like this:
const is = t => input => boolean
```

Parameter `t` is used to define the type definition for the guard.

The returned function `input => boolean` is the type guard itself, returning `true` if the `input` parameter satisfies the type definition for the guard:

```ts
import { is } from 'ts-guardian'

const data = getFromApi() // data is of type `unknown`

// Type guard for `string`
const isString = is('string')

if (isString(data)) {
  // data is of type `string`
} else {
  // data must be some other type
}
```

### `or`

`ts-guardian` wouldn't be useful unless we could define multiple types for the same value. The `is` function has an `or` method, which works in the same way:

```ts
import { is } from 'ts-guardian'

const data = getFromApi() // data is of type `unknown`

// Type guard for `string | number`
const isStringOrNumber = is('string').or('number')

if (isStringOrNumber(data)) {
  // data is of type `string | number`
} else {
  // data must be some other type
}
```

<br />

## Basic guards

Basic type guards are defined by passing a string key representing the guard type, into the `is` and `or` functions:

```ts
// Type guard for `string`
const isString = is('string')

isString(5) // returns false
isString('hello') // returns true

// Type guard for `string | number`
const isStringOrNumber = is('string').or('number')

isStringOrNumber(5) // returns true
isStringOrNumber('hello') // returns true
```

Basic type guards are the bread and butter of `ts-guardian` and are used as building blocks to form more complex type guards.

Here's the complete set of keys:

| Key           | Type of guard | Equivalent type check          |
| ------------- | ------------- | ------------------------------ |
| `'any'`       | `any`         | `true` (matches anything)      |
| `'boolean'`   | `boolean`     | `typeof <value> === 'boolean'` |
| `'bigint'`    | `bigint`      | `typeof <value> === 'bigint'`  |
| `'null'`      | `null`        | `<value> === null`             |
| `'number'`    | `number`      | `typeof <value> === 'number'`  |
| `'object'`    | `object`      | `typeof <value> === 'object'`  |
| `'string'`    | `string`      | `typeof <value> === 'string'`  |
| `'symbol'`    | `symbol`      | `typeof <value> === 'symbol'`  |
| `'undefined'` | `undefined`   | `<value> === undefined`        |
| `'unknown'`   | `unknown`     | `true` (matches anything)      |

> When combined with other guards, the `any` and `unknown` type guards take precedence. These are useful in complex types where you want to specify part of the type as `any` or `unknown`, for example, an object member.

<br />

## The `isArray` and `orArray` functions

Similar to `is` and `or`, but the passed types will be used to type the elements of an array:

```ts
import { is } from 'ts-guardian'

const data = getFromApi() // data is of type `unknown`

// Type guard for `string[]`
const isStringArray = isArray('string')

// Type guard for `(string | number)[]`
const isStringOrNumberArray = isArray(is('string').or('number'))

// Type guard for `string[] | number[]`
const isStringArrayOrNumberArray = isArray('string').orArray('number')

// Type guard for `string[] | undefined
const isStringArrayOrUndefined = is('undefined').orArray('string')
```

> Note the difference between `isArray(is('string').or('number'))` which produces a guard for `(string | number)[]`, and `isArray('string').orArray('number')` which creates a guard for `string[] | number[]`.

<br />

## Guard objects

The basic type guard for the `object` type (`is('object')`) should be used rarely, if at all, due to it matching on `null`.

When dealing with objects, prefer using a **guard object** instead:

```ts
// Type guard for `{}`
const isObject = is({})

isObject('hello') // returns false
isObject({ name: 'Bob' }) // returns true

// Type guard for `{ age: number; }`
const hasAge = is({ age: is('number') })

hasAge({ name: 'Bob' }) // returns false
hasAge({ name: 'Bob', age: 40 }) // returns true
```

<br />

## Guard tuples

To define a tuple type guard, pass in an array containing guards for each element of the tuple:

```ts
// Type guard for `[string, number]`
const isTuple = is([is('string'), is('number')])

isTuple(['hello']) // returns false
isTuple(['hello', 5]) // returns true
```

<br />

## Guard chaining

`ts-guardian` uses currying, which means you can chain as many guards together as you like:

```ts
const isMySuperComplexType = is({
  prop1: is('string').or('number').or('undefined'),
  prop2: is('boolean').or('undefined'),
  prop3: is({
    propA: is('string').or('undefined'),
    propB: is('bigint'),
    propC: is('any'),
  }).or('null'),
}).or('undefined')
```

which results in the type guard:

```ts
input is {
    prop1: string | number | undefined;
    prop2: boolean | undefined;
    prop3: {
        propA: string | undefined;
        propB: bigint;
        propC: any;
    } | null;
} | undefined
```

Go crazy!

<br />

## Guard composition

Guards can be created and reused in other guards:

```ts
// Type guard for `string`
const isString = is('string')

// Type guard for `string | undefined`
const isStringOrUndefined = isString.or('undefined')

// Super composable
const isUser = is({
  id: isString.or('number'),
  name: isString,
  email: isStringOrUndefined,
})
```

Guards can even be passed to the `or` function:

```ts
// Type guard for `number | undefined`
const isNumberOrUndefined = is('number').or('undefined')
// Type guard for `string | null`
const isStringOrNull = is('string').or('null')

// Type guard for `string | number | null | undefined`
const isStringNumberUndefinedOrNull = isStringOrNull.or(isNumberOrUndefined)
```

<br />

## Convenience guards

From the examples, you probably noticed we repeatedly defined guards for some common types.

Luckily, `ts-guardian` also exports a bunch of pre-defined convenience guards for these types:

| Guard                  | Type of guard                         | Equivalent `is` function        |
| ---------------------- | ------------------------------------- | ------------------------------- |
| `isBoolean`            | `boolean`                             | `is('boolean')`                 |
| `isBooleanOrUndefined` | <code>boolean &#124; undefined</code> | `is('boolean').or('undefined')` |
| `isBigint`             | `bigint`                              | `is('bigint')`                  |
| `isBigintOrUndefined`  | <code>bigint &#124; undefined</code>  | `is('bigint').or('undefined')`  |
| `isNull`               | `null`                                | `is('null')`                    |
| `isNullOrUndefined`    | <code>null &#124; undefined</code>    | `is('null').or('undefined')`    |
| `isNumber`             | `number`                              | `is('number')`                  |
| `isNumberOrUndefined`  | <code>number &#124; undefined</code>  | `is('number').or('undefined')`  |
| `isObject`             | `object`                              | `is('object')`                  |
| `isObjectOrUndefined`  | <code>object &#124; undefined</code>  | `is('object').or('undefined')`  |
| `isString`             | `string`                              | `is('string')`                  |
| `isStringOrUndefined`  | <code>string &#124; undefined</code>  | `is('string').or('undefined')`  |
| `isSymbol`             | `symbol`                              | `is('symbol')`                  |
| `isSymbolOrUndefined`  | <code>symbol &#124; undefined</code>  | `is('symbol').or('undefined')`  |
| `isUndefined`          | `undefined`                           | `is('undefined')`               |

This makes our code even cleaner.

Going back to the original `isUser` function and implementing convenience guards would look like:

```ts
import { is, isNumber, isString, isStringOrUndefined, isUndefined } from 'ts-guardian'

const isUser = is({
  id: isNumber,
  name: isString,
  email: isStringOrUndefined,
  phone: isUndefined.or({
    primary: isStringOrUndefined,
    secondary: isStringOrUndefined,
  }),
})
```

Nice!

<br />

[license-badge]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license]: license.md
[npm]: https://npmjs.org/package/ts-guardian
[npm-badge]: https://badge.fury.io/js/ts-guardian.svg
[user-defined-type-guards]: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
[typescript]: https://www.typescriptlang.org/docs
[functional-programming]: https://en.wikipedia.org/wiki/Functional_programming
