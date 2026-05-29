const WEBHOOK_ERRORS = process.env.SLACK_WEBHOOK_URL;

export function notifySlack(text: string, webhookUrl?: string) {
  const url = webhookUrl || WEBHOOK_ERRORS;
  if (!url) return;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}
