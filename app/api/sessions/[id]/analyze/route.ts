import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFeedback } from "@/lib/feedback-generator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const practiceSession = await db.session.findUnique({
    where: { id },
    include: { image: true },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (practiceSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (practiceSession.status !== "COMPLETED") {
    console.log(`[ANALYZE] Session=${id} not completed (status=${practiceSession.status})`);
    return NextResponse.json(
      { error: "Session must be completed before analysis" },
      { status: 400 }
    );
  }

  console.log(`[ANALYZE] Starting manual analysis for session=${id}`);

  try {
    const result = await generateFeedback(practiceSession);

    console.log(`[ANALYZE] Analysis complete for session=${id}: A=${result.ibGrades.criterionA.mark}, B1=${result.ibGrades.criterionB1.mark}, B2=${result.ibGrades.criterionB2.mark}, C=${result.ibGrades.criterionC.mark}, total=${result.ibGrades.totalMark}/30`);

    await db.session.update({
      where: { id },
      data: {
        scoreA: result.ibGrades.criterionA.mark,
        scoreB1: result.ibGrades.criterionB1.mark,
        scoreB2: result.ibGrades.criterionB2.mark,
        scoreC: result.ibGrades.criterionC.mark,
        feedback: JSON.parse(JSON.stringify(result)),
        speakingPace: result.quantitative.pace.overallWPM,
        vocabularyLevel: result.quantitative.vocabulary.estimatedLevel,
      },
    });

    console.log(`[ANALYZE] Scores saved to DB for session=${id}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error(`[ANALYZE] Analysis FAILED for session=${id}:`, err);
    const errorFeedback = {
      error: true,
      message: err instanceof Error ? err.message : "Analysis failed",
    };
    await db.session.update({
      where: { id },
      data: { feedback: errorFeedback },
    });
    return NextResponse.json(
      { error: "Analysis failed. You can retry." },
      { status: 500 }
    );
  }
}
