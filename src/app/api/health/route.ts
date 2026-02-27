import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const results: Record<string, { ok: boolean; message: string }> = {};

  // ── 1. Check env vars ──────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  results.env_supabase_url = {
    ok: !!supabaseUrl,
    message: supabaseUrl ? "Set ✓" : "MISSING — add NEXT_PUBLIC_SUPABASE_URL to .env.local",
  };
  results.env_supabase_key = {
    ok: !!supabaseKey,
    message: supabaseKey ? "Set ✓" : "MISSING — add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
  };
  results.env_anthropic_key = {
    ok: !!anthropicKey,
    message: anthropicKey
      ? `Set ✓ (length: ${anthropicKey.length}, starts: ${anthropicKey.substring(0, 10)})`
      : "MISSING — add ANTHROPIC_API_KEY to .env.local",
  };

  // ── 2. Supabase: query fuel_logs table ────────────────────────────
  if (supabaseUrl && supabaseKey) {
    try {
      const db = createClient(supabaseUrl, supabaseKey);
      const { error, count } = await db
        .from("fuel_logs")
        .select("*", { count: "exact", head: true });

      if (error) {
        results.supabase_connection = {
          ok: false,
          message: `DB error: ${error.message} — check RLS policies or run the migration`,
        };
      } else {
        results.supabase_connection = {
          ok: true,
          message: `Connected ✓ — fuel_logs table exists (${count ?? 0} rows)`,
        };
      }
    } catch (e) {
      results.supabase_connection = {
        ok: false,
        message: `Connection failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  } else {
    results.supabase_connection = { ok: false, message: "Skipped — env vars missing" };
  }

  // ── 3. Supabase Storage: upload a tiny test file to verify bucket ──
  // getBucket() requires service role key; anon key can only upload/list.
  if (supabaseUrl && supabaseKey) {
    try {
      const db = createClient(supabaseUrl, supabaseKey);
      const testFile = new Blob(["health-check"], { type: "text/plain" });
      const testPath = `health-check-${Date.now()}.txt`;

      const { error: uploadError } = await db.storage
        .from("fuel-receipts")
        .upload(testPath, testFile, { upsert: true });

      if (uploadError) {
        results.supabase_storage = {
          ok: false,
          message: `Bucket "fuel-receipts" error: ${uploadError.message} — make sure the bucket exists and is public`,
        };
      } else {
        // Clean up test file
        await db.storage.from("fuel-receipts").remove([testPath]);
        results.supabase_storage = {
          ok: true,
          message: `Bucket "fuel-receipts" accessible ✓ — upload test passed`,
        };
      }
    } catch (e) {
      results.supabase_storage = {
        ok: false,
        message: `Storage check failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  } else {
    results.supabase_storage = { ok: false, message: "Skipped — env vars missing" };
  }

  // ── 4. Anthropic: auto-discover available model then ping ──────────
  // Uses models.list() so this works regardless of which generation of
  // Claude models your API key has access to (3.x, 4.x, etc.)
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });

      // Discover models available on this key
      const modelsPage = await client.models.list({ limit: 10 });
      const available = modelsPage.data.map((m) => m.id);

      if (available.length === 0) {
        results.anthropic_api = {
          ok: false,
          message: "No models available on this API key — check account tier",
        };
      } else {
        // Prefer haiku (cheapest), then sonnet, otherwise first available
        const pingModel =
          available.find((id) => id.toLowerCase().includes("haiku")) ??
          available.find((id) => id.toLowerCase().includes("sonnet")) ??
          available[0];

        const msg = await client.messages.create({
          model: pingModel,
          max_tokens: 10,
          messages: [{ role: "user", content: "Reply with: OK" }],
        });

        const reply = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
        results.anthropic_api = {
          ok: true,
          message: `Connected ✓ — used: ${pingModel}, replied: "${reply}" | All available: ${available.join(", ")}`,
        };
      }
    } catch (e) {
      results.anthropic_api = {
        ok: false,
        message: `API error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  } else {
    results.anthropic_api = { ok: false, message: "Skipped — ANTHROPIC_API_KEY missing" };
  }

  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks: results },
    { status: allOk ? 200 : 207 }
  );
}
