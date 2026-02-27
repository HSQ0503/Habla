import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = await db.image.findUnique({ where: { id } });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return NextResponse.json(image);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.image.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Permission check:
  // - Admin can edit any image
  // - Teacher can edit own CLASS images
  // - Teacher can edit own PENDING global submissions
  // - Teacher CANNOT edit APPROVED global images
  const isOwner = existing.creatorId === session.user.id;
  const isAdmin = session.user.isAdmin;

  if (!isAdmin) {
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (existing.scope === "GLOBAL" && existing.approvalStatus === "APPROVED") {
      return NextResponse.json({ error: "Cannot edit approved global images" }, { status: 403 });
    }
  }

  const body = await request.json();
  const { theme, culturalContext, talkingPoints } = body;

  const image = await db.image.update({
    where: { id },
    data: {
      ...(theme && { theme }),
      ...(culturalContext && { culturalContext }),
      ...(talkingPoints && { talkingPoints }),
    },
  });

  return NextResponse.json(image);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = await db.image.findUnique({ where: { id } });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Permission check
  const isOwner = image.creatorId === session.user.id;
  const isAdmin = session.user.isAdmin;

  if (!isAdmin) {
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (image.scope === "GLOBAL" && image.approvalStatus === "APPROVED") {
      return NextResponse.json({ error: "Cannot delete approved global images" }, { status: 403 });
    }
  }

  // Delete from Vercel Blob if it's a blob URL
  if (image.url.includes("blob.vercel-storage.com")) {
    try {
      await del(image.url);
    } catch {
      // Continue even if blob deletion fails
    }
  }

  await db.image.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
