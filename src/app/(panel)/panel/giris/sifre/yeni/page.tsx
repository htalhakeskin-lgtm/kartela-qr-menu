import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/components/panel/auth-frame";

import { NewPasswordForm } from "../../forms";

export const metadata: Metadata = { title: "Yeni parola" };

/**
 * The reset link's page: a new password for the token in the address. The token is checked when
 * the form is sent (Better Auth: single use, 30 minutes). Token page: noindex, no referrer.
 */
export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = (await searchParams).belirtec;
  if (typeof token !== "string" || token.length < 10 || token.length > 200) {
    return (
      <AuthFrame title="Bağlantı geçersiz" lead="Parola sıfırlama bağlantısı eksik ya da bozuk.">
        <Link
          href="/panel/giris/sifre"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Yeni bir bağlantı isteyin
        </Link>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame title="Yeni parola" lead="Hesabınız için yeni bir parola belirleyin.">
      <NewPasswordForm token={token} />
    </AuthFrame>
  );
}
