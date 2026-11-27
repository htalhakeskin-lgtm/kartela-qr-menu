import type { Metadata } from "next";

import { currentPanelUser } from "@/server/panel/session";
import { platformUsers } from "@/server/platform/users";

import { AdminRoleForm } from "../forms";

export const metadata: Metadata = { title: "Kullanıcılar" };

/**
 * SCR-132: every panel account, its venues and roles, its second step, and the platform admin
 * role. Venue roles change on each venue's team page. Phone: cards (07-mobil).
 */
export default async function PlatformUsersPage() {
  const [user, accounts] = await Promise.all([currentPanelUser(), platformUsers()]);
  const readOnly = user?.demo ?? true;
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="mt-1 text-muted-foreground">
          Panel hesapları. Mekân rolleri her mekânın Ekip sayfasından verilir.
        </p>
      </header>
      {readOnly ? (
        <p role="note" className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm">
          Demo hesabıyla platform değiştirilemez; burada yalnızca görüntülenir.
        </p>
      ) : null}
      <ul className="mt-6 flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {accounts.map((account) => (
          <li key={account.id} className="flex flex-col gap-2 px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="font-medium">
                {account.name}
                {account.id === user?.id ? (
                  <span className="ms-2 text-sm font-normal text-muted-foreground">(siz)</span>
                ) : null}
              </p>
              <p className="text-sm text-muted-foreground">
                {account.platformAdmin ? "Platform yöneticisi · " : ""}
                {account.twoFactor ? "İki adım açık" : "İki adım kapalı"}
              </p>
            </div>
            <p className="text-sm break-all text-muted-foreground">{account.email}</p>
            {account.memberships.length > 0 ? (
              <p className="text-sm">{account.memberships.join(" · ")}</p>
            ) : null}
            {readOnly || account.id === user?.id ? null : (
              <AdminRoleForm
                userId={account.id}
                name={account.name}
                admin={account.platformAdmin}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
