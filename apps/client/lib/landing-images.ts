function unsplash(id: string, params = "q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/${id}?${params}`;
}

export const landingImages = {
  hero: unsplash("photo-1600952995643-a056df4f447c", "q=80&w=1400&auto=format&fit=crop"),
  heroFloatingCareWorker: unsplash("photo-1581090122319-8fab9528eaaa", "q=80&w=400&auto=format&fit=crop"),
  heroFloatingTeam: unsplash("photo-1631039302217-5a6c56371e86", "q=80&w=400&auto=format&fit=crop"),

  benefitScheduling: unsplash("photo-1631039302217-5a6c56371e86", "q=80&w=1200&auto=format&fit=crop"),
  benefitOnboarding: unsplash("photo-1581090122319-8fab9528eaaa", "q=80&w=1200&auto=format&fit=crop"),
  benefitFieldWork: unsplash("photo-1661238870576-bad5e6499390", "q=80&w=1200&auto=format&fit=crop"),
  benefitReporting: unsplash("photo-1576089235406-0612d7bb033e", "q=80&w=1200&auto=format&fit=crop"),

  teamMeeting: unsplash("photo-1742436707317-8a5044a80d33", "q=80&w=1200&auto=format&fit=crop"),

  gallery: [
    unsplash("photo-1633466152717-80f001925a6d", "q=80&w=600&auto=format&fit=crop"),
    unsplash("photo-1611239677551-a13ef92c4ed4", "q=80&w=600&auto=format&fit=crop"),
    unsplash("photo-1612414161401-6f897f88ec06", "q=80&w=600&auto=format&fit=crop"),
    unsplash("photo-1723433892471-62f113c8c9a0", "q=80&w=600&auto=format&fit=crop"),
    unsplash("photo-1540778339538-067eae485e9f", "q=80&w=600&auto=format&fit=crop"),
    unsplash("photo-1591805735743-39de24030669", "q=80&w=600&auto=format&fit=crop"),
  ],
} as const;
