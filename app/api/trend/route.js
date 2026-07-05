import { NextResponse } from "next/server";
import { getTrend } from "../../../lib/trend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trend = await getTrend(7);
    return NextResponse.json(trend);
  } catch (err) {
    return NextResponse.json(
      { configured: false, points: [], error: err.message },
      { status: 200 }
    );
  }
}
