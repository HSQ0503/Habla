import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images = await db.image.findMany({
    where: {
      scope: "GLOBAL",
      approvalStatus: "PENDING",
    },
    include: {
      creator: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(images);
}
