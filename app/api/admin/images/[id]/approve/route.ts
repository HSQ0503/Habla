import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const image = await db.image.findUnique({ where: { id } });
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const updated = await db.image.update({
    where: { id },
    data: {
      approvalStatus: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  return NextResponse.json(updated);
}
