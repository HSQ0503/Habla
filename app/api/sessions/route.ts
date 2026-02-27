import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("[SESSION:CREATE] Unauthorized request — no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageId } = await request.json();
  console.log(`[SESSION:CREATE] User ${session.user.id} creating session with imageId=${imageId}`);

  if (!imageId) {
    console.log("[SESSION:CREATE] Missing imageId");
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

  const image = await db.image.findUnique({ where: { id: imageId } });
  if (!image) {
    console.log(`[SESSION:CREATE] Image not found: ${imageId}`);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  console.log(`[SESSION:CREATE] Image found: theme=${image.theme}`);

  const practiceSession = await db.session.create({
    data: {
      userId: session.user.id,
      imageId,
      status: "PREPARING",
      prepStartedAt: new Date(),
      transcript: [],
    },
    include: { image: true },
  });

  console.log(`[SESSION:CREATE] Session created: id=${practiceSession.id}, status=PREPARING`);

  return NextResponse.json(practiceSession, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const sessions = await db.session.findMany({
    where: { userId: session.user.id },
    include: {
      image: { select: { id: true, url: true, theme: true, culturalContext: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(sessions);
}
