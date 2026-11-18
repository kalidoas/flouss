export interface ResendMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/** Send one message through Resend. Callers handle failures with generic API responses. */
export async function sendWithResend(apiKey: string, message: ResendMessage): Promise<{ ok: boolean; status: number }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  return { ok: response.ok, status: response.status };
}
