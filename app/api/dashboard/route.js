import { NextResponse } from "next/server";
import { getDashboardData } from "../../../lib/sheet";

export const dynamic = "force-dynamic"; // always fetch fresh, never cache

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
