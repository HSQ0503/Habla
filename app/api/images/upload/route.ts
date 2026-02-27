import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    console.log("[IMAGE:UPLOAD] No file provided");
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  console.log(`[IMAGE:UPLOAD] Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)}KB, type=${file.type})`);

  const blob = await put(`images/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  console.log(`[IMAGE:UPLOAD] Upload complete: ${blob.url}`);

  return NextResponse.json({ url: blob.url });
}
