// Supabase Edge Function: submit-exam
//
// Thin authentication/authorization layer. All the actual work (status
// transition, grading, result insert, audit log) happens atomically in
// grade_and_finalize_attempt() - a single Postgres function called via one
// RPC round trip. This replaces an earlier version that made ~6 sequential
// queries from this function, which occasionally timed out mid-sequence,
// leaving an attempt marked "submitted" with no matching result.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError('Missing authorization header', 401);
    }

    const { attempt_id } = await req.json();
    if (!attempt_id) {
      return jsonError('attempt_id is required', 400);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonError('Invalid or expired session', 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabaseAdmin.rpc('grade_and_finalize_attempt', {
      p_attempt_id: attempt_id,
      p_caller_id: user.id,
    });

    if (error) {
      const message = error.message ?? '';
      if (message.includes('NOT_OWNER')) return jsonError('You do not own this attempt', 403);
      if (message.includes('ATTEMPT_NOT_FOUND')) return jsonError('Attempt not found', 404);
      if (message.includes('CONCURRENT_SUBMISSION') || message.includes('ALREADY_SUBMITTED')) {
        return jsonError('This attempt was already submitted', 409);
      }
      console.error('grade_and_finalize_attempt error:', error);
      return jsonError('Failed to grade attempt', 500);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return jsonOk({ result, alreadySubmitted: result?.already_existed ?? false });
  } catch (err) {
    console.error(err);
    return jsonError('Unexpected server error', 500);
  }
});

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
