export type ExampleKey = 'pink-monkey' | 'amber-robot';
export function exampleChoice(search: string): ExampleKey {
  const key = new URLSearchParams(search).get('example') ?? 'pink-monkey';
  if (key !== 'pink-monkey' && key !== 'amber-robot') throw new RangeError(`Unknown example: ${key}`);
  return key;
}
