import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "app", "templates", "strategies");
    const files = await fs.readdir(dir);

    const templates: any[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await fs.readFile(path.join(dir, file), "utf-8");
      const data = JSON.parse(raw);
      const template_key = data.template_key ?? file.replace(/\.json$/, "");
      data.source = "template";
      data.locked = true;
      data.template_key = template_key;
      templates.push(data);
    }

    return NextResponse.json(
      { templates },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error loading templates:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}