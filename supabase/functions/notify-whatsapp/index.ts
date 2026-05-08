import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GREEN_API_ID = Deno.env.get("GREEN_API_ID")!;
const GREEN_API_TOKEN = Deno.env.get("GREEN_API_TOKEN")!;
const GROUP_CHAT_ID = Deno.env.get("GROUP_CHAT_ID")!;

serve(async (req) => {
  try {
    const rawBody = await req.text();
    console.log("Raw body received:", rawBody);

    if (!rawBody || rawBody.trim() === "") {
      console.log("Empty body received, ignoring.");
      return new Response("OK", { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    console.log("Parsed payload:", JSON.stringify(payload));

    const record = payload.record;

    if (!record) {
      console.log("No record in payload, ignoring.");
      return new Response("OK", { status: 200 });
    }

    const name     = record["Name"]      ?? "N/A";
    const date     = record["Date"]      ?? "N/A";
    const client   = record["Client"]    ?? "N/A";
    const workDone = record["Work_Done"] ?? "N/A";

    const message =
      `*New Work Entry*\n\n` +
      `*Name:* ${name}\n` +
      `*Date:* ${date}\n` +
      `*Client:* ${client}\n` +
      `*Work Done:* ${Work_Done}`;

    const response = await fetch(
      `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: GROUP_CHAT_ID,
          message: message,
        }),
      }
    );

    const resultText = await response.text();
    console.log("Green API status:", response.status);
    console.log("Green API response:", resultText);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});