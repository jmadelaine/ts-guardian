# type-guardian

## Introduction

Type guards you can trust 👍

Type Guardian uses the power of [TypeScript][typescript] and [functional programming][functional-programming] to protect your data types, so rest easy.

<br />

---

<br />

## Index

- [The problem](#the-problem)
- [The solution](#the-solution)
- [Installation](#installation)
- [The `is` function](#the-is-function)
- [The `or` function](#the-or-function)
- [Basic guards](#basic-guards)
- [Guard objects](#basic-guards)
- [Guard chaining](#guard-chaining)
- [Guard reuse](#guard-reuse)
- [Convenience guards](#convenience-guards)

<br />

---

<br />

## The problem 👎

Before using a value in our app, wa want to confirm it's of the expected type.

Consider the `User` type:

```ts
type User = {
  id: number
  name: string
  email?: string
  isEmailVerified: boolean
  phone?: {
    primary?: string
    secondary?: string
  }
}
```

With TypeScript's [user-defined type guards][user-defined-type-guards], we can confirm a value is of type `User` with something like this:

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
    typeof u.isEmailVerified === 'boolean' &&
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

An obvious problem is that the `isUser` function is **verbose**. That's a lot of code to write (and read).

**The more important (and less obvious) problem is that using user-defined type guards leaves us open to runtime errors.** 😫

<br />

We want to know that `input` can be typed as `User`, but we're relying on _our own boolean logic_. There is no connection between the boolean result and type compatibility. We simply assume that if our boolean returns `true`, then the types are compatible. And of course, our manually defined boolean will never have any bugs... right?

Unfortunately, we could just as easily write:

```ts
const isUser = (input: unknown): input is User => {
  return typeof input === 'object'
}
```

Clearly this function is not enough to confirm that `input` is of type `User`, but TypeScript doesn't complain.

User-defined type predicates are effectively type assertions. By saying to TypeScript "if I return `true`, consider `input` to be of type `User`", we lose type safety.

<br />

_So how can we guarantee that a value is compatible with our user-defined type?_

<br />

---

<br />

## The solution 👍

<br />

_We make no assumptions that the value **is** a user-defined type._

<br />

Instead, we define a **primitive-based type** of what a `User` object looks like, and let TypeScript determine whether this **primitive-based type** is compatible with the `User` type:

> A _primitive-based type_ is a type constructed only from primitve TypeScript types (`string`, `number`, `undefined`, `any`, etc...).

```ts
import { is } from 'type-guardian'

// We make no assumptions that the data is a user-defined type
const isUser = is({
  id: is('number'),
  name: is('string'),
  email: is('string').or('undefined'),
  isEmailVerified: is('boolean'),
  phone: is('undefined').or({
    primary: is('string').or('undefined'),
    secondary: is('string').or('undefined'),
  }),
})
```

Instead of `isUser` returning the type predicate `input is User`, it now returns the type predicate:

```ts
// Type predicate for our primitive-based type
input is {
    id: number;
    name: string;
    email: string | undefined;
    isEmailVerified: boolean;
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

<br />

---

<br />

## Installation

```
npm i type-guardian
```

<br />

---

<br />

## The `is` function

`type-guardian` exports the `is` function, which is a curried function used to build type guards. The `is` function takes a parameter used to define a type, and returns a type guard for that type:

```ts
// The `is` function looks something like this:
const is = t => input => boolean
```

Parameter `t` is used to define the type definition for the guard.

The returned function `(input) => boolean` is the type guard itself, returning `true` if the `input` parameter satisfies the type definition for the guard. For example:

```ts
import { is } from 'type-guardian'

const data = getFromApi() // data is of type `unknown`

// Type guard for `string` type
const isString = is('string')

if (isString(data)) {
  // `data` is of type `string`
} else {
  // `data` must be some other type
}
```

<br />

---

<br />

## The `or` function

`type-guardian` wouldn't be useful unless we could define multiple types for the same value. The `is` function has an `or` method, which works in the same way. For example:

```ts
import { is } from 'type-guardian'

const data = getFromApi() // data is of type `unknown`

// Type guard for `string | number` type
const isStringOrNumber = is('string').or('number')

if (isStringOrNumber(data)) {
  // `data` is of type `string | number`
} else {
  // `data` must be some other type
}
```

<br />

---

<br />

## Basic guards

Basic type guards are defined by passing a string key representing the guard type, into the `is` and `or` functions. For example:

```ts
// Type guard for `string` type
const isString = is('string')

isString(5) // returns false
isString('hello') // returns true

// Type guard for `string | number` type
const isStringOrNumber = is('string').or('number')

isStringOrNumber(5) // returns true
isStringOrNumber('hello') // returns true
```

Basic type guards are the bread and butter of `type-guardian` and are used as building blocks to form more complex type guards.

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

> When combined with other gaurds, the `any` and `unknown` type guards take precedence. These are useful in complex types where you want to specify part of the type as `any` or `unknown`, for example, an object member.

<br />

---

<br />

## Guard objects

The basic type guard for the `object` type (`is('object')`) should be used rarely, if at all, due to it matching on `null`.

When dealing with objects, prefer using a **guard object** instead. For example:

```ts
// Type guard for `{}` type
// Matches any non-null object with any members
const isObject = is({})

isObject('hello') // returns false
isObject({ name: 'Bob' }) // returns true

// Type guard for `{ age: number; }` type
// Matches any non-null object with the member `age` that is of type `number`
const isObjectWhereAgeIsNumber = is({ age: is('number') })

isObjectWhereAgeIsNumber({ name: 'Bob' }) // returns false
isObjectWhereAgeIsNumber({ name: 'Bob', age: 40 }) // returns true
```

<br />

---

<br />

## Guard chaining

`type-guardian` uses currying, which means you can chain as many guards together as you like!

For example:

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

---

<br />

## Guard reuse

Guards can be created and reused in other guards. For example:

```ts
// Type guard for `string` type
const isString = is('string')

// Currying allows us to extend the previous `isString` guard
// Type guard for `string | undefined` type
const isStringOrUndefined = isString.or('undefined')

const isUser = is({
  // We can pass existing guards into guard objects
  id: isString.or('number'),
  name: isString,
  email: isStringOrUndefined,
})
```

Guards can even be passed to the `or` function:

```ts
// Type guard for `number | undefined` type
const isNumberOrUndefined = is('number').or('undefined')
// Type guard for `string | null` type
const isStringOrNull = is('string').or('null')

// Type guard for `string | number | null | undefined` type
const isStringNumberUndefinedOrNull = isStringOrNull.or(isNumberOrUndefined)
```

<br />

---

<br />

## Convenience guards

From the examples, you probably noticed we repeated ourselves an awful lot when guarding simple types.

Luckily, `type-guardian` also exports a bunch of pre-defined convenience guards for common types:

| Convenience guard      | Type of guard                         | Equivalent `is` function        |
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

The original `isUser` function now looks something like this:

```ts
import { is, isNumber, isString, isStringOrUndefined, isBoolean, isUndefined } from 'type-guardian'

const isUser = is({
  id: isNumber,
  name: isString,
  email: isStringOrUndefined,
  isEmailVerified: isBoolean,
  phone: isUndefined.or({
    primary: isStringOrUndefined,
    secondary: isStringOrUndefined,
  }),
})
```

Nice!

<br />
<br />

[user-defined-type-guards]: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
[typescript]: https://www.typescriptlang.org/docs
[functional-programming]: https://en.wikipedia.org/wiki/Functional_programming
