import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GREEN_API_ID    = Deno.env.get("GREEN_API_ID")!;
const GREEN_API_TOKEN = Deno.env.get("GREEN_API_TOKEN")!;
const GROUP_CHAT_ID   = Deno.env.get("GROUP_CHAT_ID")!;
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY    = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const GROUP_CHAT_ID_2 = Deno.env.get("GROUP_CHAT_ID_2")!;

async function sendToGroup(message: string) {
  const res = await fetch(
    `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: GROUP_CHAT_ID, message }),
    }
  );
  const text = await res.text();
  console.log("Green API status:", res.status, text);
}

async function sendToSpecificGroup(chatId: string, message: string) {
  const res = await fetch(
    `https://api.green-api.com/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    }
  );
  const text = await res.text();
  console.log("Green API status (group 2):", res.status, text);
}

serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get today's start and end in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Today in IST as YYYY-MM-DD
    const todayIST = istNow.toISOString().split("T")[0];

    // Convert IST day boundaries back to UTC for querying created_at
    const startOfDayIST = new Date(`${todayIST}T00:00:00.000+05:30`);
    const endOfDayIST   = new Date(`${todayIST}T23:59:59.999+05:30`);

    console.log("Today IST:", todayIST);
    console.log("Start UTC:", startOfDayIST.toISOString());
    console.log("End UTC:", endOfDayIST.toISOString());

    const { data: entries, error } = await supabase
      .from("Staff Work")
      .select("Name, Date, Client, Work_Done, Hours, TimeStamp")
      .gte("TimeStamp", startOfDayIST.toISOString())
      .lte("TimeStamp", endOfDayIST.toISOString())
      .order("Name", { ascending: true })
      .order("Date", { ascending: true });

    console.log("Entries found:", JSON.stringify(entries));
    
    if (error) {
      console.error("Supabase error:", error);
      return new Response("DB error", { status: 500 });
    }

    if (!entries || entries.length === 0) {
      console.log("No entries inserted today.");
      await sendToGroup(` *Daily Work Summary — ${todayIST}*\n\nNo entries recorded today.`);
      return new Response("No entries", { status: 200 });
    }

    // Group by Name → Date → list of {client, work}
    const grouped: Record<string, Record<string, { client: string; work: string; Hours:number }[]>> = {};

    for (const entry of entries) {
      const name   = entry["Name"]      ?? "Unknown";
      const date   = entry["Date"]      ?? "N/A";
      const client = entry["Client"]    ?? "N/A";
      const work   = entry["Work_Done"] ?? "N/A";

      if (!grouped[name]) grouped[name] = {};
      if (!grouped[name][date]) grouped[name][date] = [];
      const hours = entry["Hours"] ?? 0;
      grouped[name][date].push({ client, work, hours });;
    }

    // Send header message
    await sendToGroup(
      `*Daily Work Summary — ${todayIST}*\n${Object.keys(grouped).length} employee(s) reported.`
    );

    await new Promise((r) => setTimeout(r, 1500));

    // Names that go to second group — add as many as needed
    const redirectedEmployees = ["Steeve Tom"];

    // Send one message per employee
    for (const [name, dateMap] of Object.entries(grouped)) {
      let message = ` *${name}*\n\n`;

      for (const [date, tasks] of Object.entries(dateMap)) {
        message += ` *${date}*\n`;
        for (const t of tasks) {
          message += `    *${t.client}*\n`;
          message += `    ${t.work} ${t.hours} hrs\n`;
        }
        message += `\n`;
      }

      // Send to second group if name is in redirect list, else main group
      if (redirectedEmployees.includes(name)) {
        await sendToSpecificGroup(GROUP_CHAT_ID_2, message.trim());
      } else {
        await sendToGroup(message.trim());
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    return new Response("Done", { status: 200 });

  } catch (err) {
    console.error("Error:", err);
    return new Response(String(err), { status: 500 });
  }
});