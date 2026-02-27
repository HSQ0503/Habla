import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
    include: { _count: { select: { students: true } } },
  });

  return NextResponse.json({ class: teacherClass });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Class already exists" }, { status: 409 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate unique code
  let code = generateCode();
  while (await db.class.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const newClass = await db.class.create({
    data: { name: name.trim(), code, teacherId: session.user.id },
  });

  return NextResponse.json({ class: newClass }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherClass = await db.class.findFirst({
    where: { teacherId: session.user.id },
  });
  if (!teacherClass) {
    return NextResponse.json({ error: "No class found" }, { status: 404 });
  }

  const { name, regenerateCode } = await request.json();
  const data: { name?: string; code?: string } = {};

  if (name && typeof name === "string") {
    data.name = name.trim();
  }

  if (regenerateCode) {
    let code = generateCode();
    while (await db.class.findUnique({ where: { code } })) {
      code = generateCode();
    }
    data.code = code;
  }

  const updated = await db.class.update({
    where: { id: teacherClass.id },
    data,
  });

  return NextResponse.json({ class: updated });
}
