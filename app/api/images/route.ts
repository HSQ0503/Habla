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

  const images = await db.image.findMany({
    where: theme ? { theme: theme as "IDENTITIES" | "EXPERIENCES" | "HUMAN_INGENUITY" | "SOCIAL_ORGANIZATION" | "SHARING_THE_PLANET" } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, theme, culturalContext, talkingPoints } = body;

  if (!url || !theme || !culturalContext || !talkingPoints?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const image = await db.image.create({
    data: { url, theme, culturalContext, talkingPoints },
  });

  return NextResponse.json(image, { status: 201 });
}
