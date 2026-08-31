const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function getOnboardingDocumentUrl(storedName: string) {
  return `${API_BASE}/onboarding/documents/${encodeURIComponent(storedName)}`;
}

export async function openOnboardingDocument(storedName: string, accessToken: string) {
  const response = await fetch(getOnboardingDocumentUrl(storedName), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Could not open document");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
