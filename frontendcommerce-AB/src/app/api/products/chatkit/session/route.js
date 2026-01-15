import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
    }

    const r = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit-beta-v1",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // server-only
      },
      body: JSON.stringify({
        workflow: { id: process.env.OPENAI_WORKFLOW_ID },
        user: deviceId,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const data = await r.json();
    return NextResponse.json({ client_secret: data.client_secret });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}