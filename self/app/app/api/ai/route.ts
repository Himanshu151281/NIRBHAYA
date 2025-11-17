import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body
    const body = await req.json();
    const { query, context } = body;

    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

    // Forward request to AI backend running locally
    const aiResponse = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, context }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      return NextResponse.json(
        { error: `AI backend error: ${text}` },
        { status: 500 }
      );
    }

    const data = await aiResponse.json();

    // Return AI backend response to frontend
    return NextResponse.json(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
