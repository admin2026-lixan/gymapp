import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeStats, generateTipText, highlightTypeFor } from "@/lib/daily-tip";
import { sendToUser } from "@/lib/push-fanout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const todayStr = () => new Date().toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = todayStr();

  const { data: subs } = await admin.from("push_subscriptions").select("user_id");
  const userIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));

  let sent = 0;
  let skipped = 0;

  for (const userId of userIds) {
    // Reusar el tip si ya se generó hoy (p. ej. porque el usuario abrió el dashboard)
    const { data: existing } = await admin
      .from("daily_tips")
      .select("tip_text")
      .eq("user_id", userId)
      .eq("tip_date", today)
      .maybeSingle();

    let tipText = existing?.tip_text as string | undefined;

    if (!tipText) {
      const stats = await computeStats(admin, userId);
      const generated = await generateTipText(stats);
      if (!generated) {
        skipped++;
        continue;
      }
      tipText = generated;
      await admin.from("daily_tips").upsert(
        { user_id: userId, tip_date: today, tip_text: generated, highlight_type: highlightTypeFor(stats) },
        { onConflict: "user_id,tip_date" }
      );
    }

    await sendToUser(admin, userId, {
      title: "🤖 Tip de hoy",
      body: tipText,
      url: "/dashboard",
    });
    sent++;
  }

  return NextResponse.json({ ok: true, users: userIds.length, sent, skipped });
}
