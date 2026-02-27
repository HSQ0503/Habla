import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme");
  const scope = searchParams.get("scope");
  const teacherId = searchParams.get("teacherId");
  const creatorId = searchParams.get("creatorId");

  const isTeacher = session.user.role === "TEACHER";

  // Teacher viewing their own images (library page)
  if (creatorId && isTeacher && creatorId === session.user.id) {
    const images = await db.image.findMany({
      where: {
        creatorId,
        ...(theme && { theme: theme as never }),
        ...(scope && { scope: scope as never }),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images);
  }

  // Class library: teacher's class images
  if (scope === "CLASS" && teacherId) {
    const images = await db.image.findMany({
      where: {
        creatorId: teacherId,
        scope: "CLASS",
        ...(theme && { theme: theme as never }),
      },
      orderBy: { createdAt: "desc" },
      ...(!isTeacher && {
        select: { id: true, url: true, theme: true, createdAt: true },
      }),
    });
    return NextResponse.json(images);
  }

  // Global library: approved global images only
  if (scope === "GLOBAL" || !scope) {
    const images = await db.image.findMany({
      where: {
        scope: "GLOBAL",
        approvalStatus: "APPROVED",
        ...(theme && { theme: theme as never }),
      },
      orderBy: { createdAt: "desc" },
      ...(!isTeacher && {
        select: { id: true, url: true, theme: true, createdAt: true },
      }),
    });
    return NextResponse.json(images);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, theme, culturalContext, talkingPoints, aiAnalysis, scope } = body;

  if (!url || !theme || !culturalContext || !talkingPoints?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const imageScope = scope === "GLOBAL" ? "GLOBAL" : "CLASS";

  const image = await db.image.create({
    data: {
      url,
      theme,
      culturalContext,
      talkingPoints,
      creatorId: session.user.id,
      scope: imageScope,
      // Class images are auto-approved; global submissions need review
      approvalStatus: imageScope === "CLASS" ? "APPROVED" : "PENDING",
      ...(aiAnalysis && { aiAnalysis }),
    },
  });

  return NextResponse.json(image, { status: 201 });
}
