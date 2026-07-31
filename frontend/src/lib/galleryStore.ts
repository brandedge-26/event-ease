// In-memory store for gallery files during onboarding.
// Files are kept in JS memory as the user navigates client-side between steps.
// Cleared after upload in the verify step.
let files: File[] = [];

export const galleryStore = {
  set:   (f: File[]) => { files = f; },
  get:   ()          => files,
  clear: ()          => { files = []; },
};
