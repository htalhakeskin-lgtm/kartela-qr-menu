import "server-only";

import { env } from "@/lib/env";
import { saveToDemoOutbox } from "@/server/db/tenant";
import { logger } from "@/server/logger";

import { renderTemplate, type TemplateData, type TemplateName } from "./templates";

/**
 * The only way the app talks to the outside world (02-mimari §5, MM-05).
 * PLATFORM_DEMO=true → nothing leaves the system; the message is stored in demo_outbox and shown
 * in the panel's "Demo kutusu". Going live only changes environment variables.
 */
export type Channel = "email" | "sms" | "whatsapp";

export type OutboundMessage<N extends TemplateName = TemplateName> = {
  channel: Channel;
  to: string; // e-mail address or E.164 phone
  template: N;
  data: TemplateData<N>;
  relatedId?: string; // invitation / user id, shown in the record timeline
  venueId?: string; // set for a venue's own messages (P2: waiter call)
};

type Provider = (message: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => Promise<void>;

const providers: Record<Channel, Provider | undefined> = {
  email: async ({ to, subject, text, html }) => {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM)
      throw new Error("E-mail provider is not configured");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text, html }),
    });
    if (!response.ok) throw new Error(`Resend responded ${response.status}`);
  },
  sms: undefined, // add Netgsm / İleti Merkezi when the plan includes E-05
  whatsapp: undefined, // add WhatsApp Cloud API when the plan includes E-02
};

export async function send<N extends TemplateName>(message: OutboundMessage<N>): Promise<void> {
  if (env.PLATFORM_DEMO) {
    await saveToDemoOutbox({
      channel: message.channel,
      to: message.to,
      template: message.template,
      data: message.data,
      relatedId: message.relatedId,
      venueId: message.venueId,
    });
    return;
  }

  const provider = providers[message.channel];
  if (!provider) throw new Error(`Channel ${message.channel} is not configured`);
  const rendered = renderTemplate(message.template, message.data);
  await provider({ to: message.to, ...rendered });
  logger.info("channel.sent", {
    channel: message.channel,
    template: message.template,
    relatedId: message.relatedId,
  });
}
