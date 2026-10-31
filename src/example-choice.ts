import {examples} from './examples/metadata';
export type ExampleKey = keyof typeof examples;
export function exampleChoice(search: string): ExampleKey {
  const key = new URLSearchParams(search).get('example') ?? 'pink-monkey';
  if (!Object.hasOwn(examples,key)) throw new RangeError(`Unknown example: ${key}`);
  return key as ExampleKey;
}
