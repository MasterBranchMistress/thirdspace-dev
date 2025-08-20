// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS, DBS } from "@/lib/constants";
import { ObjectId } from "mongodb";
import { syncUserAvatar } from "@/utils/sync-user-avatar/syncAvatar";

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { avatar } = await req.json();
    const { fileName, fileType } = avatar ?? {};

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DBS._THIRDSPACE);
    const users = db.collection(COLLECTIONS._USERS);

    const safe = sanitizeFileName(fileName);
    const key = `avatars/${Date.now()}-${safe}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const result = await users.updateOne(
      { _id: new ObjectId(String(id)) },
      {
        $set: {
          avatar: publicUrl,
          avatarMetaData: {},
          avatarLastUpdatedAt: new Date(),
        },
      }
    );

    await syncUserAvatar(String(id), publicUrl);
    const updatedUser = await users.findOne({ _id: new ObjectId(id) });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ updatedUser, signedUrl, key, publicUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
