// A "label" added to distinguish values that are the same runtime type (e.g., string)
// but should be treated as different types by the TypeScript compiler.
type Brand<T, B extends string> = T & { readonly __brand: B };

export type Address = Lowercase<`0x${string}`>;
export type HexString = `0x${string}`;

export type Token = Brand<Address, 'Token'>;
export type Pool = Brand<Address, 'Pool'>;
export type Hash = Brand<HexString, 'Hash'>;
