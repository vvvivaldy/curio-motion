export type ExampleKey = 'pink-monkey' | 'amber-robot' | 'black-cat-chair';
export function exampleChoice(search: string): ExampleKey {
  const key = new URLSearchParams(search).get('example') ?? 'pink-monkey';
  if (key !== 'pink-monkey' && key !== 'amber-robot' && key !== 'black-cat-chair') throw new RangeError(`Unknown example: ${key}`);
  return key;
}
