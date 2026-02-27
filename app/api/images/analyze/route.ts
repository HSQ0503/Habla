import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI();

const ANALYSIS_PROMPT = `You are an IB Spanish Individual Oral (IO) assessment expert. Analyze this image thoroughly so that an AI examiner can conduct a realistic IO examination about it.

Provide your analysis in the following JSON format:
{
  "description": "A detailed, objective description of everything visible in the image (2-3 paragraphs). Describe people, objects, setting, actions, colors, text, and spatial relationships.",
  "culturalContext": "Explain the cultural significance of what's shown. What Spanish-speaking culture(s) does this relate to? What cultural practices, traditions, values, or social dynamics are represented? (2-3 paragraphs)",
  "themes": ["List which IB themes this image connects to and why"],
  "talkingPoints": [
    "Specific discussion point 1 an examiner could ask about",
    "Specific discussion point 2",
    "Specific discussion point 3",
    "Specific discussion point 4",
    "Specific discussion point 5",
    "Specific discussion point 6"
  ],
  "deeperQuestions": [
    "A probing question connecting the image to broader cultural issues",
    "A question about personal connections a student might have",
    "A question comparing this to the student's own culture",
    "A question about how this relates to global issues"
  ],
  "vocabularyHints": ["Key Spanish vocabulary words relevant to discussing this image"],
  "suggestedTheme": "The single most appropriate IB theme: IDENTITIES, EXPERIENCES, HUMAN_INGENUITY, SOCIAL_ORGANIZATION, or SHARING_THE_PLANET"
}

Be thorough — the AI examiner will rely entirely on your analysis to ask intelligent, culturally-informed follow-up questions.
Respond with ONLY the JSON object, no markdown fencing or extra text.`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { imageUrl } = body;

  if (!imageUrl) {
    console.log("[IMAGE:ANALYZE] Missing imageUrl");
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
  }

  console.log(`[IMAGE:ANALYZE] Analyzing image: ${imageUrl.substring(0, 80)}...`);

  try {
    console.log("[IMAGE:ANALYZE] Calling GPT-4o vision");
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content || "";
    const elapsed = Date.now() - startTime;
    console.log(`[IMAGE:ANALYZE] GPT-4o responded in ${elapsed}ms (${completion.usage?.total_tokens || "?"} tokens)`);

    // Strip markdown fencing if present
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    const analysis = JSON.parse(cleaned);

    console.log(`[IMAGE:ANALYZE] Analysis complete: suggestedTheme=${analysis.suggestedTheme}, ${analysis.talkingPoints?.length || 0} talking points, ${analysis.deeperQuestions?.length || 0} questions`);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[IMAGE:ANALYZE] Image analysis FAILED:", err);
    return NextResponse.json(
      { error: "Failed to analyze image. You can fill in the fields manually." },
      { status: 500 }
    );
  }
}
