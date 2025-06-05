import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const body = await req.json();

  const { type, record, old_record } = body;

  let match_id: string | undefined;
  let user_id: string | undefined;
  let event: "joined" | "left" | undefined;

  if (type === "INSERT") {
    match_id = record?.match_id;
    user_id = record?.user_id;
    event = "joined";
  } else if (type === "DELETE") {
    match_id = old_record?.match_id;
    user_id = old_record?.user_id;
    event = "left";
  } else {
    return new Response("Unsupported event type", { status: 400 });
  }

  if (!match_id || !user_id || !event) {
    return new Response("Missing match_id or user_id", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: actorProfile } = await supabase
    .from("user_profiles")
    .select("name")
    .eq("id", user_id)
    .single();

  const { data: participants } = await supabase
    .from("match_participants")
    .select("user_id")
    .eq("match_id", match_id)
    .neq("user_id", user_id);

  const userIds = participants?.map((p) => p.user_id) || [];

  if (userIds.length === 0) {
    return new Response("No other participants to notify", { status: 200 });
  }

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("expo_push_token")
    .in("id", userIds);

  const messages = [];

  for (const profile of profiles || []) {
    if (profile.expo_push_token) {
      messages.push({
        to: profile.expo_push_token,
        sound: "default",
        body: `${actorProfile?.name || "Someone"} has ${event} the match.`,
        data: { match_id },
      });
    }
  }

  if (messages.length > 0) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log("Expo Push API response:", result);
    } catch (e) {
      console.error("Push error:", e);
    }
  }

  const tokens = messages.map((m) => m.to).join(", ");
  return new Response(
    `Notifications sent to ${messages.length} participants about ${
      actorProfile?.name || "Someone"
    } ${event}ing the match. Tokens used: ${tokens}`,
    { status: 200 }
  );
});
