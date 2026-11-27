import type { Metadata } from "next";
import Link from "next/link";

import { AuthFrame } from "@/components/panel/auth-frame";
import { ROLE_LABELS } from "@/config/permissions";
import { invitationView } from "@/server/panel/team";

import { AcceptInvitationForm } from "../../forms";

export const metadata: Metadata = { title: "Davet" };

/**
 * A panel invitation (plan §8): the link's token names the invitation; a new address sets its
 * name and password, an existing account confirms with its password. Token page: noindex and no
 * referrer (proxy.ts, 09-seo SEO-08).
 */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ belirtec: string }>;
}) {
  const { belirtec } = await params;
  const view = await invitationView(belirtec, new Date());
  if (!view) {
    return (
      <AuthFrame
        title="Davet geçersiz"
        lead="Bu davet kullanılmış, geri alınmış ya da süresi dolmuş. Mekânın sahibinden yeni bir davet isteyin."
      >
        <Link
          href="/panel/giris"
          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
        >
          Giriş sayfasına git
        </Link>
      </AuthFrame>
    );
  }
  const { invitation, hasAccount } = view;
  return (
    <AuthFrame
      title={`${invitation.venueName} ekibine davet`}
      lead={`Rol: ${ROLE_LABELS[invitation.role]} · Hesap: ${invitation.email}`}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        {hasAccount
          ? "Bu e-postayla bir Kartela hesabınız var. Parolanızı girdiğinizde davet kabul edilir."
          : "Panele girmek için adınızı ve bir parola belirleyin."}
      </p>
      <AcceptInvitationForm token={belirtec} hasAccount={hasAccount} email={invitation.email} />
    </AuthFrame>
  );
}
