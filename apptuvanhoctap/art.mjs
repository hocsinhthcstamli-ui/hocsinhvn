// Optimized copies of the user-supplied artwork. Source files remain in anh/.
import { newArtNames } from "./new-art.mjs";
export const artNames = [
  ...newArtNames,
  "stage-1",
  "stage-2",
  "stage-3",
  "buddy-welcome",
  "buddy-growing",
  "buddy-success",
  "badge-start",
  "badge-connect",
  "badge-independent",
  "garden",
  "journey-background",
  "lesson-cover",
  "buddy-request",
];
export const artFiles = artNames.map((name) => `/assets/art/${name}.webp`);
export function picture(name, className = "", eager = false) {
  if (!artNames.includes(name)) return "";
  return `<img class="illustration ${className}" src="/assets/art/${name}.webp" alt="" aria-hidden="true" width="320" height="320" decoding="async" loading="${eager ? "eager" : "lazy"}">`;
}
