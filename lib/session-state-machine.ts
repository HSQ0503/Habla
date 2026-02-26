import { db } from "@/lib/db";
import type { SessionStatus } from "@prisma/client";

const validTransitions: Record<SessionStatus, SessionStatus[]> = {
  PREPARING: ["PRESENTING", "TERMINATED"],
  PRESENTING: ["CONVERSING", "TERMINATED"],
  CONVERSING: ["COMPLETED", "TERMINATED"],
  COMPLETED: [],
  TERMINATED: [],
};

const timestampField: Partial<Record<SessionStatus, string>> = {
  PRESENTING: "presentStartedAt",
  CONVERSING: "converseStartedAt",
  COMPLETED: "completedAt",
};

export async function advanceSession(sessionId: string, targetStatus: SessionStatus) {
  const session = await db.session.findUnique({ where: { id: sessionId } });

  if (!session) {
    throw new Error("Session not found");
  }

  const allowed = validTransitions[session.status];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Cannot transition from ${session.status} to ${targetStatus}`
    );
  }

  const timestamp = timestampField[targetStatus];
  const data: Record<string, unknown> = { status: targetStatus };
  if (timestamp) {
    data[timestamp] = new Date();
  }

  return db.session.update({
    where: { id: sessionId },
    data,
    include: { image: true },
  });
}

export async function terminateSession(sessionId: string) {
  const session = await db.session.findUnique({ where: { id: sessionId } });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status === "COMPLETED" || session.status === "TERMINATED") {
    throw new Error(`Session is already ${session.status}`);
  }

  return db.session.update({
    where: { id: sessionId },
    data: { status: "TERMINATED", completedAt: new Date() },
    include: { image: true },
  });
}
