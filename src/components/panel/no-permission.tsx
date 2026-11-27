/** A venue page the role cannot use (plan §8): the menu hides it, a typed address lands here. */
export function NoPermission({ title }: { title: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 rounded-lg border border-border bg-surface p-5 text-muted-foreground">
        Bu sayfa için rolünüzün yetkisi yok. Gerekirse mekânın sahibinden rolünüzü değiştirmesini
        isteyin.
      </p>
    </>
  );
}
