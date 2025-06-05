import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const body = await req.json();

  const { type, record } = body;

  if (type !== "INSERT") {
    return new Response("Only INSERT events are supported", { status: 400 });
  }

  const match_id = record?.match_id;
  const sender_id = record?.sender_id;
  const message = record?.message;

  if (!match_id || !sender_id || !message) {
    return new Response("Missing required fields", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: senderProfile } = await supabase
    .from("user_profiles")
    .select("name")
    .eq("id", sender_id)
    .single();

  const { data: participants } = await supabase
    .from("match_participants")
    .select("user_id")
    .eq("match_id", match_id)
    .neq("user_id", sender_id);

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
        body: `${senderProfile?.name || "Someone"}: ${message}`,
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

  return new Response(
    `Notifications sent to ${messages.length} participants.`,
    { status: 200 }
  );
});
