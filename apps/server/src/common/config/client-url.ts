export function getClientBaseUrl(): string {
  return (process.env.CLIENT_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}

export function buildInviteUrl(token: string): string {
  return `${getClientBaseUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
}
