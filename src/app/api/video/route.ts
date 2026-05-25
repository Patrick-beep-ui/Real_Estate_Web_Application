import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");

  if (!file) {
    return NextResponse.json(
      { error: "Missing file" },
      { status: 400 }
    );
  }

  try {
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: file,
      limit: 1,
    });

    const blob = blobs[0];

    if (!blob) {
      return NextResponse.json(
        { error: "Blob not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: blob.downloadUrl,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch blob" },
      { status: 500 }
    );
  }
}