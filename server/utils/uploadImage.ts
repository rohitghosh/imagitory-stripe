import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

const bucket = getStorage().bucket();

export async function uploadBase64ToFirebase(
  base64: string,
  fileName: string,
): Promise<string> {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const normalizedFileName = fileName.normalize("NFKD");
  const sanitisedFileName = normalizedFileName.replace(/[^\w\-\/\.]/g, "_");

  const file = bucket.file(sanitisedFileName);
  const uuid = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
      metadata: {
        firebaseStorageDownloadTokens: uuid,
      },
    },
    public: false,
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    sanitisedFileName,
  )}?alt=media&token=${uuid}`;
}
