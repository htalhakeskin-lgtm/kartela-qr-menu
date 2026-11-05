import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/panel/auth-frame";
import { PANEL_HOME, safeReturnPath } from "@/lib/safe-path";
import { hasPendingSecondStep } from "@/server/panel/sign-in";

import { SecondStepForm } from "./second-step-form";

export const metadata: Metadata = { title: "İki adımlı doğrulama" };

/** SCR-101: second step after a correct password, for accounts with TOTP (plan §8). */
export default async function SecondStepPage({ searchParams }: PageProps<"/panel/giris/dogrula">) {
  if (!(await hasPendingSecondStep())) redirect("/panel/giris");
  const query = await searchParams;
  const back = safeReturnPath(query.donus);
  const donus = back === PANEL_HOME ? undefined : back;
  return (
    <AuthFrame
      title="İki adımlı doğrulama"
      lead="Parolanız doğru. Girişi tamamlamak için doğrulama kodunu girin."
    >
      <SecondStepForm method="totp" donus={donus} />
      <details className="mt-8 border-t border-border pt-6">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          Telefonunuz yanınızda değil mi? Yedek kod kullanın
        </summary>
        <div className="mt-4">
          <SecondStepForm method="yedek" donus={donus} />
        </div>
      </details>
      <p className="mt-8 text-sm">
        <Link
          href="/panel/giris"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Başka bir hesapla giriş yap
        </Link>
      </p>
    </AuthFrame>
  );
}
