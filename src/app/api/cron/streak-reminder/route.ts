import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToUser } from "@/lib/push-fanout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function dayStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: subs } = await admin.from("push_subscriptions").select("user_id");
  const userIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));

  const since = new Date();
  since.setDate(since.getDate() - 60);

  let notified = 0;

  for (const userId of userIds) {
    const { data: sessions } = await admin
      .from("workout_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .gte("started_at", since.toISOString());

    const days = new Set((sessions ?? []).map((s) => s.started_at.slice(0, 10)));
    const today = dayStr(new Date());

    if (days.has(today)) continue; // ya entrenó hoy, nada que avisar

    // Racha de días consecutivos que termina AYER (si hoy no entrena, se corta)
    let streak = 0;
    const cursor = new Date();
    cursor.setDate(cursor.getDate() - 1);
    while (days.has(dayStr(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    if (streak < 2) continue; // no vale la pena molestar por una racha muy corta

    await sendToUser(admin, userId, {
      title: "🔥 No pierdas tu racha",
      body: `Llevás ${streak} días seguidos entrenando y hoy todavía no registraste nada. ¡Sumá uno más!`,
      url: "/log",
    });
    notified++;
  }

  return NextResponse.json({ ok: true, users: userIds.length, notified });
}
