import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  // Check if already in a class
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { classId: true },
  });
  if (user?.classId) {
    return NextResponse.json({ error: "Already in a class" }, { status: 409 });
  }

  const targetClass = await db.class.findUnique({
    where: { code: code.toUpperCase().trim() },
    select: { id: true, name: true },
  });
  if (!targetClass) {
    return NextResponse.json({ error: "Invalid class code" }, { status: 404 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { classId: targetClass.id },
  });

  return NextResponse.json({ class: { id: targetClass.id, name: targetClass.name } });
}
