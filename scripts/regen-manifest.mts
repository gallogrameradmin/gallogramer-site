import "dotenv/config";
import { config as dotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { regenerateAllManifests } from "../app/lib/manifest";

const here = dirname(fileURLToPath(import.meta.url));
dotenv({ path: join(here, "..", ".env.local") });

const r = await regenerateAllManifests();
console.log(`Photos: ${r.photos.count} → ${r.photos.url}`);
console.log(`Videos: ${r.videos.count} → ${r.videos.url}`);
