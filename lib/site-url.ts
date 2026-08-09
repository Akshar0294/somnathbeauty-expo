export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const rawUrl = configuredUrl || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");
  return new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
}
