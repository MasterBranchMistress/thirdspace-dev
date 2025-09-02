import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { ObjectId } from "mongodb";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME!;

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9._-]/g, "_")
    .slice(0, 100);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ new React/Next requires await
) {
  try {
    const { id } = await context.params;
    const { files } = await req.json();
    // expected shape: { files: [{ fileName, fileType }, ...] }

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const presignedResponses: {
      signedUrl: string;
      key: string;
      publicUrl: string;
    }[] = [];

    for (const file of files) {
      const safe = sanitizeFileName(file.fileName);
      const key = `event-attachments/${id}/${Date.now()}-${safe}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: file.fileType,
      });

      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      presignedResponses.push({ signedUrl, key, publicUrl });
    }

    // update event doc with all public URLs
    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const events = db.collection(COLLECTIONS._EVENTS);

    const result = await events.updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: {
          attachments: {
            $each: presignedResponses.map((file) => file.publicUrl),
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ files: presignedResponses });
  } catch (error) {
    console.error("Error generating signed URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URLs" },
      { status: 500 }
    );
  }
}
