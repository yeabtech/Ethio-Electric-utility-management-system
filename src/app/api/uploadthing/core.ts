// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  serviceDocuments: f({
    blob: { maxFileSize: "16MB", maxFileCount: 5 },
    "text/csv": { maxFileSize: "16MB", maxFileCount: 5 }
  })
    .onUploadComplete(({ file }) => {
      console.log("file uploaded", file.ufsUrl);
    }),
  customerVerification: f({
    image: { maxFileSize: "4MB", maxFileCount: 3 }
  })
    .onUploadComplete(({ file }) => {
      console.log("verification file uploaded", file.ufsUrl);
    }),
  newsImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 }
  })
    .onUploadComplete(({ file }) => {
      console.log("news image uploaded", file.ufsUrl);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;


//canged to ufsUrl