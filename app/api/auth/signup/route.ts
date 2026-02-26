import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, classCode } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (role !== "STUDENT" && role !== "TEACHER") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let classId: string | undefined;
    if (role === "STUDENT" && classCode) {
      const classRecord = await db.class.findUnique({
        where: { code: classCode },
      });

      if (!classRecord) {
        return NextResponse.json(
          { error: "Invalid class code" },
          { status: 404 }
        );
      }

      classId = classRecord.id;
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        classId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        classId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
