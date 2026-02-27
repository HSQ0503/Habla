import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.classId) {
    return NextResponse.json({ class: null });
  }

  const cls = await db.class.findUnique({
    where: { id: session.user.classId },
    select: {
      id: true,
      name: true,
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ class: cls });
}
