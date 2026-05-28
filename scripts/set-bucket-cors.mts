/**
 * Включает CORS на бакетах: PUT/GET/HEAD из www.gallogramer.com + vercel.app + localhost.
 * Запуск: npx tsx scripts/set-bucket-cors.mts
 */
import { config as dotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

const here = dirname(fileURLToPath(import.meta.url));
dotenv({ path: join(here, "..", ".env.local") });

const s3 = new S3Client({
  region: "ru-central1",
  endpoint: process.env.YC_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.YC_S3_KEY!,
    secretAccessKey: process.env.YC_S3_SECRET!,
  },
  forcePathStyle: false,
});

const ALLOWED_ORIGINS = [
  "https://www.gallogramer.com",
  "https://gallogramer.com",
  "https://gallogramer-site.vercel.app",
  "http://localhost:3000",
];

const corsRules = {
  CORSRules: [
    {
      AllowedOrigins: ALLOWED_ORIGINS,
      AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "x-amz-request-id"],
      MaxAgeSeconds: 3000,
    },
  ],
};

for (const bucket of [
  process.env.YC_PHOTOS_BUCKET!,
  process.env.YC_VIDEOS_BUCKET!,
]) {
  await s3.send(
    new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: corsRules }),
  );
  console.log(`✓ CORS set on ${bucket}`);
  const got = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("  rules:", JSON.stringify(got.CORSRules, null, 2));
}
