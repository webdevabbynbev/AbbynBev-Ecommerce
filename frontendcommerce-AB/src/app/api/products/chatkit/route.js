import { NextResponse } from "next/server";
import { runWorkflow } from "@/lib/chatkit/workflow";

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const message = (body?.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const result = await runWorkflow({ input_as_text: message });

    return NextResponse.json(
      {
        output_text: result.outputText,
        category: result.category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/chatkit] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Chatkit API error" },
      { status: 500 }
    );
  }
}