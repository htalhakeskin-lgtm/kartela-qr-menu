import type { Metadata } from "next";

import { NoPermission } from "@/components/panel/no-permission";
import { PanelCard } from "@/components/panel/ui";
import { ROLE_LABELS } from "@/config/permissions";
import { formatDate } from "@/lib/format";
import { requireVenuePage } from "@/server/panel/session";
import { teamView } from "@/server/panel/team";

import { CancelInvitation, InviteForm, MemberActions } from "./forms";

export const metadata: Metadata = { title: "Ekip" };

/** SCR-118: team and invitations (owner). Phone: cards, not a table (07-mobil). */
export default async function TeamPage({ params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  const { user, venue, allowed } = await requireVenuePage(mekan, "members.manage");
  if (!allowed) return <NoPermission title="Ekip" />;
  const team = await teamView(venue.id, user.id, new Date());

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ekip</h1>
        <p className="mt-1 text-muted-foreground">
          Panele kimin hangi rolle girdiği. Personel müsaitliği, yönetici menüyü, sahip her şeyi
          yönetir.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <PanelCard
          id="davet"
          title="Ekibe davet"
          description="Davet bağlantısı 7 gün geçerlidir; kabul eden kişi kendi parolasını belirler."
        >
          {user.demo ? (
            <p className="text-sm text-muted-foreground">
              Demo hesabıyla ekip değiştirilemez; davet, rol değişikliği ve çıkarma gerçek
              hesaplarda çalışır.
            </p>
          ) : (
            <InviteForm venueId={venue.id} />
          )}
        </PanelCard>

        <PanelCard id="uyeler" title={`Üyeler (${String(team.members.length)})`}>
          <ul className="flex flex-col divide-y divide-border">
            {team.members.map((member) => (
              <li key={member.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-medium">
                    {member.name}
                    {member.you ? (
                      <span className="ms-2 text-sm font-normal text-muted-foreground">(siz)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[member.role]} · {formatDate(member.since, "short")} tarihinden beri
                  </p>
                </div>
                <p className="text-sm break-all text-muted-foreground">{member.email}</p>
                {user.demo ? null : (
                  <MemberActions
                    venueId={venue.id}
                    memberId={member.id}
                    name={member.name}
                    role={member.role}
                  />
                )}
              </li>
            ))}
          </ul>
        </PanelCard>

        {team.invitations.length > 0 ? (
          <PanelCard id="davetler" title="Bekleyen davetler">
            <ul className="flex flex-col divide-y divide-border">
              {team.invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="break-all">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {ROLE_LABELS[invitation.role]} · son gün{" "}
                      {formatDate(invitation.expiresAt, "short")}
                    </p>
                  </div>
                  {user.demo ? null : (
                    <CancelInvitation
                      venueId={venue.id}
                      invitationId={invitation.id}
                      email={invitation.email}
                    />
                  )}
                </li>
              ))}
            </ul>
          </PanelCard>
        ) : null}
      </div>
    </>
  );
}
