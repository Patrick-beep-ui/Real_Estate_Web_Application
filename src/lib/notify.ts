const WEBHOOK_ERRORS = process.env.SLACK_WEBHOOK_URL;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function notifySlack(text: string, webhookUrl?: string) {
  if (process.env.SLACK_ALERTS_DISABLED === "true") {
    console.warn("[notifySlack] Skipped — SLACK_ALERTS_DISABLED is true");
    return;
  }
  const url = webhookUrl || WEBHOOK_ERRORS;
  if (!url) {
    console.warn("[notifySlack] Skipped — no webhook URL configured (SLACK_WEBHOOK_URL not set)");
    return;
  }

  console.log(`[notifySlack] Sending to ${url.slice(0, 30)}... (${text.slice(0, 60)}...)`);

  void (async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(1000 * Math.pow(2, attempt - 1));
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          console.log(`[notifySlack] Sent successfully (attempt ${attempt + 1})`);
          return;
        }
        if (res.status >= 400 && res.status < 500) {
          console.warn(`[notifySlack] Attempt ${attempt + 1} returned ${res.status} — not retrying`);
          break;
        }
        console.warn(`[notifySlack] Attempt ${attempt + 1} returned ${res.status} — retrying...`);
      } catch (e) {
        console.error(`[notifySlack] Attempt ${attempt + 1} threw:`, e instanceof Error ? e.message : e);
      }
    }
    console.warn(`[notifySlack] All ${MAX_RETRIES} attempts failed for ${url.slice(0, 40)}...`);
  })();
}