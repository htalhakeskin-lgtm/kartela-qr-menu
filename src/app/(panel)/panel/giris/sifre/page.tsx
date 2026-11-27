import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/components/panel/auth-frame";

import { ResetRequestForm } from "../forms";

export const metadata: Metadata = { title: "Parola sıfırlama" };

/** Password reset request (11-guvenlik §4): the same answer whether or not the address exists. */
export default function ResetRequestPage() {
  return (
    <AuthFrame
      title="Parolamı unuttum"
      lead="Hesabınızın e-posta adresini girin; parolanızı yenilemeniz için bir bağlantı gönderelim."
    >
      <ResetRequestForm />
      <p className="mt-8 text-sm">
        <Link
          href="/panel/giris"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      </p>
    </AuthFrame>
  );
}
