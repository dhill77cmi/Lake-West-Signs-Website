/** Keep the opening photo fixed and shuffle the rest without repetitions. */
export function shuffleAfterFirst<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 1; index--) {
    const target = 1 + Math.floor(random() * index);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
