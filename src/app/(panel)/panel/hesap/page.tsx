import type { Metadata } from "next";

import { PanelShell } from "@/components/panel/shell";
import { PanelCard } from "@/components/panel/ui";
import { ROLE_LABELS } from "@/config/permissions";
import { currentPanelVenues, needsSecondStep, requirePanelUser } from "@/server/panel/session";

import { PasswordForm, TwoFactorOffForm, TwoFactorSetupForm } from "./forms";

export const metadata: Metadata = { title: "Hesabım" };

const NOTICES: Record<string, string> = {
  acildi: "İki adımlı doğrulama açıldı. Bir sonraki girişte uygulamadaki kod sorulacak.",
  kapandi: "İki adımlı doğrulama kapatıldı.",
  degisti: "Parolanız değiştirildi; diğer cihazlardaki oturumlar kapatıldı.",
};

/**
 * "Hesabım": the second step and the password (plan §8, BR-YTK-002). When the second step is
 * required and missing, every other panel page sends the user here.
 */
export default async function AccountPage({ searchParams }: PageProps<"/panel/hesap">) {
  const user = await requirePanelUser({ allowWithoutSecondStep: true });
  const venues = await currentPanelVenues();
  const required = await needsSecondStep(user);
  const query = await searchParams;
  const notice = [query["iki-adim"], query.parola]
    .map((key) => (typeof key === "string" ? NOTICES[key] : undefined))
    .find(Boolean);
  const memberships = venues.filter((venue) => venue.role !== "platform");

  return (
    <PanelShell user={user} venue={null} venues={required ? [] : venues}>
      <h1 className="text-2xl font-semibold tracking-tight">Hesabım</h1>
      <p className="mt-1 text-muted-foreground">
        {user.name} · {user.email}
      </p>

      {required ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-warning/50 bg-warning/5 px-4 py-3 text-sm"
        >
          Bu hesap için iki adımlı doğrulama zorunlu. Panele devam etmek için aşağıdan açın.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        <PanelCard
          id="iki-adim"
          title="İki adımlı doğrulama"
          description="Girişte parolaya ek olarak telefonunuzdaki uygulamanın ürettiği kod sorulur."
        >
          {user.demo ? (
            <p className="text-sm text-muted-foreground">
              Demo hesapları ortak kullanıldığı için iki adımlı doğrulama açılamaz.
            </p>
          ) : user.twoFactorEnabled ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm">
                <span className="font-medium text-success">Açık.</span> Kodlarınızı kaybederseniz
                yedek kodlardan biriyle girebilirsiniz.
              </p>
              {required ? null : <TwoFactorOffForm />}
            </div>
          ) : (
            <TwoFactorSetupForm />
          )}
        </PanelCard>

        <PanelCard id="parola" title="Parola">
          {user.demo ? (
            <p className="text-sm text-muted-foreground">Demo hesabının parolası değiştirilemez.</p>
          ) : (
            <PasswordForm />
          )}
        </PanelCard>

        {memberships.length > 0 || user.platformAdmin ? (
          <PanelCard id="roller" title="Rolleriniz">
            <ul className="divide-y divide-border">
              {user.platformAdmin ? (
                <li className="flex items-baseline justify-between gap-4 py-2.5">
                  <span>Kartela platformu</span>
                  <span className="text-sm text-muted-foreground">{ROLE_LABELS.platform}</span>
                </li>
              ) : null}
              {memberships.map((venue) => (
                <li key={venue.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="min-w-0">{venue.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {ROLE_LABELS[venue.role]}
                  </span>
                </li>
              ))}
            </ul>
          </PanelCard>
        ) : null}
      </div>
    </PanelShell>
  );
}
