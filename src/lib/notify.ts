const WEBHOOK_ERRORS = process.env.TEST_SLACK_WEBHOOK_URL;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function notifySlack(text: string, webhookUrl?: string) {
  if (process.env.SLACK_ALERTS_DISABLED === "true") return;
  const url = webhookUrl || WEBHOOK_ERRORS;
  if (!url) return;

  void (async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(1000 * Math.pow(2, attempt - 1));
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (res.ok) return;
        if (res.status >= 400 && res.status < 500) break;
      } catch {}
    }
    console.warn(`[notifySlack] Failed to send to ${url.slice(0, 40)}...`);
  })();
}
