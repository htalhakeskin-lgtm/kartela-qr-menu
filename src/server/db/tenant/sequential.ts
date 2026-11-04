/**
 * Runs lazy Drizzle queries one after the other. A tenant transaction holds one pg connection,
 * and pg does not allow overlapping queries on a client (deprecated in pg 8, removed in pg 9), so
 * Promise.all over a transaction's queries is not an option. Same typing as Promise.all.
 */
export async function sequential<T extends readonly unknown[]>(queries: {
  readonly [K in keyof T]: PromiseLike<T[K]>;
}): Promise<T> {
  const results: unknown[] = [];
  for (const query of queries) results.push(await query);
  return results as unknown as T;
}
