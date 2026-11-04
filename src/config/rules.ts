/**
 * Business rule codes (plan §9) → user-facing Turkish message. The code is also the error
 * code returned by actions and the prefix of the rule's test names (18-dokumantasyon §3).
 * Messages say what happened and what to do next (05-sunucu-ve-api §4). Each slice adds the
 * messages of the rules it implements.
 */
export const ruleMessages = {
  "BR-KRC-002": "Bu kayıt başka bir mekâna ait olduğu için bağlanamaz.",
  "BR-KRC-003": "Bu mekânda bu işlem için yetkiniz yok.",
  "BR-YSL-001":
    "Yeme-içme mekânlarında servis, masa ya da kuver ücreti tanımlanamaz (Fiyat Etiketi Yönetmeliği, 30.01.2026).",
  "BR-YTK-003": "Mekânın son sahibi çıkarılamaz. Önce başka bir kişiyi sahip yapın.",
} as const satisfies Record<`BR-${string}`, string>;

export type RuleCode = keyof typeof ruleMessages;
