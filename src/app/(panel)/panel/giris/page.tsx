import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/panel/auth-frame";
import { PANEL_HOME, safeReturnPath } from "@/lib/safe-path";
import { currentPanelUser } from "@/server/panel/session";
import { demoChoices } from "@/server/panel/sign-in";

import { DemoSignIn, SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Giriş" };

/** SCR-100: panel sign-in. Accounts are invited (no sign-up); the demo offers one per role. */
export default async function SignInPage({ searchParams }: PageProps<"/panel/giris">) {
  const query = await searchParams;
  const back = safeReturnPath(query.donus);
  if (await currentPanelUser()) redirect(back as never);

  const choices = demoChoices();
  const expired = query.sure === "doldu";
  return (
    <AuthFrame title="Panele giriş" lead="Mekânınızın menüsünü, müsaitliğini ve ekibini yönetin.">
      {expired ? (
        <p role="status" className="mb-6 rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          Doğrulamanın süresi doldu. Lütfen yeniden giriş yapın.
        </p>
      ) : null}
      <SignInForm donus={back === PANEL_HOME ? undefined : back} />
      {choices.length > 0 ? (
        <section aria-labelledby="demo-hesaplari" className="mt-10 border-t border-border pt-8">
          <h2 id="demo-hesaplari" className="text-base font-semibold">
            Demo hesapları
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Her rolün panelde ne gördüğünü denemek için tek dokunuşla girin. Demo verisi
            kurgusaldır.
          </p>
          <DemoSignIn choices={choices} />
        </section>
      ) : null}
    </AuthFrame>
  );
}
