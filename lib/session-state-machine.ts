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
    console.log(`[STATE] Session not found: ${sessionId}`);
    throw new Error("Session not found");
  }

  const allowed = validTransitions[session.status];
  if (!allowed.includes(targetStatus)) {
    console.log(`[STATE] Invalid transition: ${session.status} → ${targetStatus} (session=${sessionId})`);
    throw new Error(
      `Cannot transition from ${session.status} to ${targetStatus}`
    );
  }

  console.log(`[STATE] Transitioning session=${sessionId}: ${session.status} → ${targetStatus}`);

  const timestamp = timestampField[targetStatus];
  const data: Record<string, unknown> = { status: targetStatus };
  if (timestamp) {
    data[timestamp] = new Date();
  }

  const updated = await db.session.update({
    where: { id: sessionId },
    data,
    include: { image: true },
  });

  console.log(`[STATE] Transition complete: session=${sessionId} is now ${targetStatus}`);
  return updated;
}

export async function terminateSession(sessionId: string) {
  const session = await db.session.findUnique({ where: { id: sessionId } });

  if (!session) {
    console.log(`[STATE] Terminate failed — session not found: ${sessionId}`);
    throw new Error("Session not found");
  }

  if (session.status === "COMPLETED" || session.status === "TERMINATED") {
    console.log(`[STATE] Terminate failed — session=${sessionId} already ${session.status}`);
    throw new Error(`Session is already ${session.status}`);
  }

  console.log(`[STATE] Terminating session=${sessionId} from ${session.status}`);

  const updated = await db.session.update({
    where: { id: sessionId },
    data: { status: "TERMINATED", completedAt: new Date() },
    include: { image: true },
  });

  console.log(`[STATE] Session=${sessionId} terminated`);
  return updated;
}
