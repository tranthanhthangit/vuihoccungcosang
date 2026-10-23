import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables or window config
function sanitizeSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  // Strip accidental /rest/v1 or /rest/v1/ if copied directly from the REST API box
  url = url.replace(/\/rest\/v1\/?$/, '');
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envUrl = sanitizeSupabaseUrl(rawEnvUrl);
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    envUrl &&
    envAnonKey &&
    envUrl.startsWith('https://') &&
    envUrl.includes('.supabase.co') &&
    !envAnonKey.includes('your-anon-public-key')
  );
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 15,
        },
      },
    });
    console.log('[Supabase] Initialized successfully with project:', envUrl);
  } catch (err) {
    console.warn('[Supabase] Initialization failed, running in local fallback mode:', err);
    clientInstance = null;
  }
} else {
  console.info('[Supabase] No credentials configured. Running in local Offline/IndexedDB mode.');
}

export const supabase: SupabaseClient | null = clientInstance;

/**
 * Helper to upload image dataUrl (Base64) or File directly to Supabase Storage bucket 'game-assets'
 */
export async function uploadGameAsset(
  path: string,
  fileOrBase64: File | string,
  contentType: string = 'image/png'
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    let fileBody: File | Blob;
    if (typeof fileOrBase64 === 'string') {
      // Decode base64
      const commaIdx = fileOrBase64.indexOf(',');
      const rawBase64 = commaIdx >= 0 ? fileOrBase64.slice(commaIdx + 1) : fileOrBase64;
      const byteCharacters = atob(rawBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileBody = new Blob([byteArray], { type: contentType });
    } else {
      fileBody = fileOrBase64;
    }

    const cleanPath = path.replace(/^\/+/, '');
    const { error } = await supabase.storage
      .from('game-assets')
      .upload(cleanPath, fileBody, {
        upsert: true,
        contentType: contentType,
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('game-assets')
      .getPublicUrl(cleanPath);

    return publicData.publicUrl;
  } catch (err) {
    console.error('[Supabase Storage] Unexpected error uploading asset:', err);
    return null;
  }
}
