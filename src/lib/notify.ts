const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export function notifySlack(text: string) {
  if (!WEBHOOK_URL) return;
  void fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}
