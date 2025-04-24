[![MIT license][license-badge]][license]
[![NPM version][npm-badge]][npm]

# ts-guardian

**Runtime type guards. Composable, TypeScript-like syntax. 100% type-safe.**

Full TypeScript support _(TypeScript not required)_.

<br />

### Type guards?

Type guards let you check whether a value matches a type at runtime.
`ts-guardian` makes them composable, readable, and type-safe — no more verbose checks or unsafe assertions.

If you're working with API responses, optional object members, or unknown values, `ts-guardian` will help you out.

<br />

## Installation

```
npm install ts-guardian
```

<br />

## Quick Start

Import the `is` function and create a type-guard, such as `isUser`. Use that type-guard to confirm objects match the type:

```ts
import { is, isOptional } from 'ts-guardian'

const isUser = is({
  id: 'number',
  name: 'string',
  email: isOptional('string'),
  teamIds: 'number[]',
})

isUser({ id: 1, name: 'John', teamIds: [12345] }) // true
```

<br />

### Core principles

- **Minimal and declarative syntax** improves readability.
- **Composable type guards** mimick the way types are constructed.
- **100% type-safety** means no assumptions, [type assertions, or inaccurate type predicates](#type-safe-type-guards).

<br />

## API

- [`is` function](#is-function)
- [Basic types](#basic-types)
- [Union types](#union-types)
- [Intersection types](#intersection-types)
- [Literal types](#literal-types)
- [Array types](#array-types)
- [Object types](#object-types)
- [Tuple types](#tuple-types)
- [Instance types](#instance-types)
- [Optional and nullable types](#optional-and-nullable-types)
- [Parsing to user-defined types](#parsing-to-user-defined-types)
- [Composition](#composition)
- [Throwing](#throwing)
- [Convenience guards](#convenience-guards)

<br />

### `is` function

```ts
import { is } from 'ts-guardian'
```

The main tool to create type guards. The `is` function takes a parameter that defines a type, and returns a guard for that type:

```ts
const isNumber = is('number') // guard for 'number'
isNumber(0) // true
isNumber('') // false
```

<br />

### Basic types

Pass a type string to create guards for basic types:

```ts
const isBoolean = is('boolean') // guard for 'boolean'
const isNull = is('null') // guard for 'null'
```

All basic type strings:

| String        | Type        | Equivalent type check           |
| ------------- | ----------- | ------------------------------- |
| `'any'`       | `any`       | `true` (matches anything)       |
| `'boolean'`   | `boolean`   | `typeof <value> === 'boolean'`  |
| `'bigint'`    | `bigint`    | `typeof <value> === 'bigint'`   |
| `'function'`  | `Function`  | `typeof <value> === 'function'` |
| `'null'`      | `null`      | `<value> === null`              |
| `'number'`    | `number`    | `typeof <value> === 'number'`   |
| `'object'`    | `object`    | `typeof <value> === 'object'`   |
| `'string'`    | `string`    | `typeof <value> === 'string'`   |
| `'symbol'`    | `symbol`    | `typeof <value> === 'symbol'`   |
| `'undefined'` | `undefined` | `<value> === undefined`         |
| `'unknown'`   | `unknown`   | `true` (matches anything)       |

> Basic guards will return false for objects created with constructors. For example, `is('string')(new String())` returns `false`. Use [`isInstanceOf`](#instance-types) instead.

<br />

### Union types

Every guard has an `or` method with the same signature as `is`. You can use `or` to create union types:

```ts
const isStringOrNumber = is('string').or('number') // guard for 'string | number'
isStringOrNumber('') // true
isStringOrNumber(0) // true
isStringOrNumber(true) // false
```

<br />

### Literal types

Pass a `number`, `string`, or `boolean` to the `isLiterally` function and the `orLiterally` method to create guards for literal types. You can also pass multiple arguments to create literal union type guards:

```ts
import { isLiterally } from 'ts-guardian'

const isCat = isLiterally('cat') // guard for '"cat"'
const is5 = isLiterally(5) // guard for '5'
const isTrue = isLiterally(true) // guard for 'true'
const isCatOr5 = isLiterally('cat').orLiterally(5) // guard for '"cat" | 5'
const isCatOr5OrTrue = isLiterally('cat', 5, true) // guard for '"cat" | 5 | true'
```

<br />

### Array types

To check that every element in an array is of a specific type, use the `isArrayOf` function and the `orArrayOf` method:

```ts
import { is, isArrayOf } from 'ts-guardian'

const isStrArr = isArrayOf('string') // guard for 'string[]'
const isStrOrNumArr = isArrayOf(is('string').or('number')) // guard for '(string | number)[]'
const isStrArrOrNumArr = isArrayOf('string').orArrayOf('number') // guard for 'string[] | number[]'
```

> Note the difference between `isStrOrNumArr` which is a guard for `(string | number)[]`, and `isStrArrOrNumArr` which is a guard for `string[] | number[]`.

For basic array types, you can simply pass a string to the `is` function instead of using `isArrayOf`:

```ts
import { is } from 'ts-guardian'

const isStrArr = is('string[]') // guard for 'string[]'
const isStrArrOrNumArr = is('string[]').or('number[]') // guard for 'string[] | number[]'
```

<br />

### Record types

To check that every value in an object is of a specific type, use the `isRecordOf` function and the `orRecordOf` method:

```ts
import { is, isRecordOf } from 'ts-guardian'

const isStrRecord = isRecordOf('string') // guard for 'Record<PropertyKey, string>'
const isStrOrNumRecord = isRecordOf(is('string').or('number')) // guard for 'Record<PropertyKey, string | number>'
const isStrRecordOrNumRecord = isRecordOf('string').orRecordOf('number') // guard for 'Record<PropertyKey, string> | Record<PropertyKey, number>'
```

<br />

### Tuple types

Guards for tuples are defined by passing a tuple to `is`:

```ts
const isStrNumTuple = is(['string', 'number']) // guard for '[string, number]'
isStrNumTuple(['high']) // false
isStrNumTuple(['high', 5]) // true
```

Guards for nested tuples can be defined by nesting tuple guards inside tuple guards:

```ts
const isStrAndNumNumTupleTuple = is(['string', is(['number', 'number'])]) // guard for '['string', [number, number]]'
```

<br />

### Object types

Use `is({})` to check for any non-null object. Avoid `is('object')` as it matches null:

```ts
const isObject = is({}) // guard for '{}'
isObject({ some: 'prop' }) // true
isObject(null) // false
```

To create a guard for an object with specific members, define a guard for each member key:

```ts
const hasAge = is({ age: 'number' }) // guard for '{ age: number; }'
hasAge({ name: 'John' }) // false
hasAge({ name: 'John', age: 40 }) // true
```

<br />

### Intersection types

Every type guard has an `and` method which has the same signature as `or`. Use `and` to create intersection types:

```ts
const hasXOrY = is({ x: 'any' }).or({ y: 'any' }) // guard for '{ x: any; } | { y: any; }'
hasXOrY({ x: '' }) // true
hasXOrY({ y: '' }) // true
hasXOrY({ x: '', y: '' }) // true

const hasXAndY = is({ x: 'any' }).and({ y: 'any' }) // guard for '{ x: any; } & { y: any; }'
hasXAndY({ x: '' }) // false
hasXAndY({ y: '' }) // false
hasXAndY({ x: '', y: '' }) // true
```

<br />

### Instance types

Guards for object instances are defined by passing a constructor object to the `isInstanceOf` function and the `orInstanceOf` method:

```ts
const isDate = isInstanceOf(Date) // guard for 'Date'
isDate(new Date()) // true

const isRegExpOrUndefined = is('undefined').orInstanceOf(RegExp) // guard for 'undefined | RegExp'
isRegExpOrUndefined(/./) // true
isRegExpOrUndefined(new RegExp('.')) // true
isRegExpOrUndefined(undefined) // true
```

This works with user-defined classes too:

```ts
class Person {
  name: string
  constructor(name: string) {
    this.name = name
  }
}

const john = new Person('John')
const isPerson = isInstanceOf(Person) // guard for 'Person'
isPerson(john) // true
```

<br />

### Optional and nullable types

Use `isOptional`, `isNullable`, and `isNullish` to quickly create guards for optional and nullable types:

```ts
import { isOptional, isNullable, isNullish } from 'ts-guardian'

const isOptionalNumber = isOptional('number') // guard for 'number | undefined'
const isNullableNumber = isNullable('number') // guard for 'number | null'
const isNullishNumber = isNullish('number') // guard for 'number | null | undefined'
```

<br />

### Parsing to user-defined types

Consider the following type and its guard:

```ts
type Book = {
  title: string
  author: string
}

const isBook = is({
  title: 'string',
  author: 'string',
})
```

If `isBook` returns `true` for a value, that value will be typed as:

```ts
{
  title: string
  author: string
}
```

Ideally, we want to type the value as `Book`, while [avoiding type assertions and user-defined type predicates](#type-safe-type-guards).

One way is with a parse function that utilizes TypeScript's implicit casting:

```ts
const parseBook = (input: any): Book | undefined => {
  return isBook(input) ? input : undefined
}
```

TypeScript will complain if the type predicate returned from `isBook` is not compatible with the `Book` type. This function is type-safe, but defining it is tedious.

Instead, you can use the `parserFor` function:

```ts
import { parserFor } from 'ts-guardian'

const parseBook = parserFor<Book>(isBook)
```

The `parserFor` function takes a guard, and returns a function you can use to parse values.

This function acts in the same way as the previous `parseBook` function. It takes a value and passes it to the guard. If the guard matches, it returns the value typed as the supplied user-defined type. If the guard does not match, the function returns `undefined`:

```ts
const book = {
  title: 'Odyssey',
  author: 'Homer',
}

const film = {
  title: 'Psycho',
  director: 'Alfred Hitchcock',
}

parseBook(book) // book as type 'Book'
parseBook(film) // undefined
```

The `parserFor` function is type-safe. TypeScript will complain if you try to create a parser for a user-defined type that isn't compatible with the supplied type guard:

```ts
const parseBook = parserFor<Book>(isBook) // Fine
const parseBook = parserFor<Book>(isString) // TypeScript error - type 'string' is not assignable to type 'Book'
```

<br />

### Composition

Guards can be composed from existing guards:

```ts
const isString = is('string') // guard for 'string'
const isStringOrUndefined = isString.or('undefined') // guard for 'string | undefined'
```

You can even pass guards into `or`:

```ts
const isStrOrNum = is('string').or('number') // guard for 'string | number'
const isNullOrUndef = is('null').or('undefined') // guard for 'null | undefined'
// guard for 'string | number | null | undefined'
const isStrOrNumOrNullOrUndef = isStrOrNum.or(isNullOrUndef)
```

<br />

### Throwing

Use the `requireThat` function to throw an error if a value does not match a guard:

```ts
import { is, requireThat } from 'ts-guardian'

const value = getSomeUnknownValue()
// Throws an error if type of value is not 'string'
// Error message: Type of 'value' does not match type guard.
requireThat(value, is('string'))
// Otherwise, type of value is 'string'
value.toUpperCase()
```

You can optionally pass an error message to `requireThat`:

```ts
import { isUser } from '../myTypeGuards/isUser'

requireThat(value, isUser, 'Value is not a user!')
```

<br />

### Convenience guards

Some frequently used guards are provided for convenience:

| Guard                   | Type                                   | Equivalent to                    |
| ----------------------- | -------------------------------------- | -------------------------------- |
| `isBoolean`             | `boolean`                              | `is('boolean')`                  |
| `isBooleanOrNull`       | <code>boolean &#124; null</code>       | `is('boolean').or('null')`       |
| `isBooleanOrUndefined`  | <code>boolean &#124; undefined</code>  | `is('boolean').or('undefined')`  |
| `isBigint`              | `bigint`                               | `is('bigint')`                   |
| `isBigintOrNull`        | <code>bigint &#124; null</code>        | `is('bigint').or('null')`        |
| `isBigintOrUndefined`   | <code>bigint &#124; undefined</code>   | `is('bigint').or('undefined')`   |
| `isFunction`            | `Function`                             | `is('function')`                 |
| `isFunctionOrNull`      | <code>Function &#124; null</code>      | `is('function').or('null')`      |
| `isFunctionOrUndefined` | <code>Function &#124; undefined</code> | `is('function').or('undefined')` |
| `isNull`                | `null`                                 | `is('null')`                     |
| `isNullOrUndefined`     | <code>null &#124; undefined</code>     | `is('null').or('undefined')`     |
| `isNumber`              | `number`                               | `is('number')`                   |
| `isNumberOrNull`        | <code>number &#124; null</code>        | `is('number').or('null')`        |
| `isNumberOrUndefined`   | <code>number &#124; undefined</code>   | `is('number').or('undefined')`   |
| `isString`              | `string`                               | `is('string')`                   |
| `isStringOrNull`        | <code>string &#124; null</code>        | `is('string').or('null')`        |
| `isStringOrUndefined`   | <code>string &#124; undefined</code>   | `is('string').or('undefined')`   |
| `isSymbol`              | `symbol`                               | `is('symbol')`                   |
| `isSymbolOrNull`        | <code>symbol &#124; null</code>        | `is('symbol').or('null')`        |
| `isSymbolOrUndefined`   | <code>symbol &#124; undefined</code>   | `is('symbol').or('undefined')`   |
| `isUndefined`           | `undefined`                            | `is('undefined')`                |

<br />

## Type-safe type guards

Consider the following problem:

You fetch data from an API. How do you ensure it's a valid User before using it?

The `User` type:

```ts
type User = {
  id: number
  name: string
  email?: string
  phone?: {
    primary?: string
    secondary?: string
  }
  teamIds: string[]
}
```

### Solution 1 - User-defined type guards 👎

With TypeScript's [user-defined type guards][user-defined-type-guards], you could write an `isUser` function to confirm the value is of type `User`. It might look something like this:

```ts
const isUser = (input: any): input is User => {
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
      u.phone === undefined) &&
    Array.isArray(u.teamIds) &&
    u.teamIds.every(teamId => typeof teamId === 'string')
  )
}
```

Hard to read, but it works. However, you could also write:

```ts
const isUser = (input: any): input is User => {
  return typeof input === 'object'
}
```

Clearly this function is not enough to confirm that `input` is of type `User`, but TypeScript doesn't complain because _type predicates are effectively type assertions._

Using type predicates means you potentially lose type safety and introduce **runtime errors** into your app.

### Solution 2 - Primitive-based type guards 👍

Rather than making assumptions about the value, you define a **primitive-based type** of what a `User` object looks like, and rely on TypeScript to determine compatibility with the `User` type:

> A _primitive-based type_ is a type constructed from only primitive TypeScript types (`string`, `number`, `undefined`, `any`, etc...).

```ts
import { is } from 'ts-guardian'

// We make no assumptions that the data is a user-defined type
const isUser = is({
  id: 'number',
  name: 'string',
  email: isOptional('string'),
  phone: isOptional({
    primary: isOptional('string'),
    secondary: isOptional('string'),
  }),
  teamIds: 'string[]',
})
```

This is much more readable, and more importantly, it's 100% type-safe.

In this case, the type predicate looks like:

```ts
// Type predicate for our primitive-based type
input is {
    id: number
    name: string
    email: string | undefined
    phone: {
        primary: string | undefined
        secondary: string | undefined
    } | undefined
    teamIds: string[]
}
```

Now TypeScript will tell you if this type is compatible with `User`:

```ts
// TypeScript complains if the primitive-based type is not compatible with 'User'
const parseUser = parserFor<User>(isUser)
```

If the type from `isUser` is not compatible with the `User`, a TypeScript compiler error will let you know. 🎉

<br />

[license-badge]: https://img.shields.io/badge/license-MIT-informational.svg
[license]: license.md
[npm]: https://npmjs.org/package/ts-guardian
[npm-badge]: https://badge.fury.io/js/ts-guardian.svg
[user-defined-type-guards]: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
[typescript]: https://www.typescriptlang.org/docs
[functional-programming]: https://en.wikipedia.org/wiki/Functional_programming
