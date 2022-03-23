# Changelog

[1.6.1] 2022-03-21

- Remove guard names

[1.6.0] 2022-03-21

- Objects and Tuple guards accept Basic Types

[1.5.0] 2022-03-02

- isLiterally and orLiterally allow multiple arguments

[1.4.1] 2021-03-12

- Add test for plain objects inside guard objects
- Update README

[1.4.0] 2021-02-27

- Add instance type support with `isInstanceOf` and `orInstanceOf`
- Add `isDate`, `isDateOrNull`, and `isDateOrUndefined` convenience guards
- Add `isRegExp`, `isRegExpOrNull`, and `isRegExpOrUndefined` convenience guards

[1.3.0] 2021-02-07

- Add support for intersection types with `and` method
- Fix `isLiterally` and `orLiterally` type generation when checking strings that match basic type strings

[1.2.0] 2020-12-27

- Throw `TypeError` instead of `Error` in `assertThat`

[1.1.3] 2020-12-22

- Add `function` to Basic Type keys table in README

[1.1.2] 2020-12-18

- Update license in `package.json`

[1.1.1] 2020-12-17

- Update license

[1.1.0] 2020-12-17

- Add `Function` guard

[1.0.0] 2020-12-16

- First major release

[0.0.10] 2020-12-16

- Export `Guard` and `GuardType` types
- Remove `isObject`, `isObjectOrNull`, and `isObjectOrUndefined` convenience guards

[0.0.9] 2020-12-08

- Add `assertThat` function

[0.0.8] 2020-12-07

- Add `is_OrNull` helpers
- Add literal type support with `isLiterally` and `orLiterally`

[0.0.7] 2020-11-26

- Rename `createParser` to `parserFor`
- Rename `isArray` to `isArrayOf`

[0.0.6] 2020-11-25

- Add parsing support with `createParser`

[0.0.5] 2020-11-25

- Prevent mutation of an extended guards' orTypes

[0.0.4] 2020-11-25

- Add support for tuples

[0.0.3] 2020-11-23

- Add support for array types with `isArray` and `orArray`

[0.0.1] 2020-11-23

- Initial release
