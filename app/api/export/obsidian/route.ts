import { NextRequest, NextResponse } from "next/server";
import { syncToObsidian } from "@/lib/export/obsidian";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    let customPath: string | undefined;

    try {
      const body = await req.json();
      if (body?.vaultPath && typeof body.vaultPath === "string") {
        const pathVal = body.vaultPath.trim();
        customPath = pathVal;
        // Persist the vault path to settings
        await db
          .insert(settings)
          .values({ key: "obsidian_vault_path", value: pathVal })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: pathVal },
          });
      }
    } catch {
      // Empty body is allowed, will use saved setting or default
    }

    const result = await syncToObsidian(customPath);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/export/obsidian] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Obsidian senkronizasyonu başarısız oldu." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const savedSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "obsidian_vault_path"));

    const vaultPath =
      savedSetting[0]?.value ||
      "C:\\Users\\smetc\\Documents\\Obsidian Vault\\30-Kaynaklar\\X Yer İmlerim";

    return NextResponse.json({ vaultPath });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Ayar yüklenemedi." },
      { status: 500 }
    );
  }
}
