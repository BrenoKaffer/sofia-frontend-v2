import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "no_session" }, { status: 401 });
}
