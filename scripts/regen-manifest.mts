import { regenerateAllManifests } from "../app/lib/manifest";

const r = regenerateAllManifests();
console.log(`Photos: ${r.photos.count} → ${r.photos.path}`);
console.log(`Videos: ${r.videos.count} → ${r.videos.path}`);
