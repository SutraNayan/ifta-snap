import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Copy .env.local.example to .env.local and fill in your credentials."
    );
  }
  _client = createClient(url, key);
  return _client;
}

// Lazy proxy — safe at build time when env vars are absent
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getClient()[prop as keyof SupabaseClient];
  },
});

export async function uploadReceiptImage(
  file: File,
  truckId: string
): Promise<string> {
  const client = getClient();
  const timestamp = Date.now();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `receipts/${truckId}/${timestamp}.${ext}`;

  const { error } = await client.storage
    .from("fuel-receipts")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = client.storage.from("fuel-receipts").getPublicUrl(path);
  return data.publicUrl;
}
