import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Admin: get all global images (approved, for management)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const images = await db.image.findMany({
    where: {
      scope: "GLOBAL",
      ...(status && { approvalStatus: status as never }),
    },
    include: {
      creator: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(images);
}

// Admin: create a directly-approved global image
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, theme, culturalContext, talkingPoints, aiAnalysis } = body;

  if (!url || !theme || !culturalContext || !talkingPoints?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const image = await db.image.create({
    data: {
      url,
      theme,
      culturalContext,
      talkingPoints,
      creatorId: session.user.id,
      scope: "GLOBAL",
      approvalStatus: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      ...(aiAnalysis && { aiAnalysis }),
    },
  });

  return NextResponse.json(image, { status: 201 });
}
