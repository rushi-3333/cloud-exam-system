// Supabase Edge Function: submit-exam
//
// This is the ONE authoritative place scoring happens. It runs with the
// service-role key (never exposed to the browser), so it can read
// question_options.is_correct - something no student-facing query is ever
// allowed to do (see get_options_for_student() in the RLS migrations).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt) {
      return jsonError('Attempt not found', 404);
    }

    if (attempt.student_id !== user.id) {
      return jsonError('You do not own this attempt', 403);
    }

    if (attempt.status !== 'in_progress') {
      const { data: existingResult } = await supabaseAdmin
        .from('results')
        .select('*')
        .eq('attempt_id', attempt_id)
        .maybeSingle();
      if (existingResult) {
        return jsonOk({ result: existingResult, alreadySubmitted: true });
      }
      return jsonError('This attempt is no longer in progress', 409);
    }

    const now = new Date();
    const deadline = new Date(attempt.server_deadline_at);
    const isLate = now > deadline;
    const finalStatus = isLate ? 'auto_submitted' : 'submitted';

    const { data: updatedAttempt, error: updateError } = await supabaseAdmin
      .from('exam_attempts')
      .update({ status: finalStatus, submitted_at: now.toISOString() })
      .eq('id', attempt_id)
      .eq('status', 'in_progress')
      .select()
      .single();

    if (updateError || !updatedAttempt) {
      return jsonError('This attempt was already submitted by another request', 409);
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, marks, question_options(id, is_correct)')
      .eq('exam_id', attempt.exam_id);

    if (questionsError || !questions) {
      return jsonError('Failed to load questions for grading', 500);
    }

    const { data: answers, error: answersError } = await supabaseAdmin
      .from('answers')
      .select('question_id, selected_option_id')
      .eq('attempt_id', attempt_id);

    if (answersError) {
      return jsonError('Failed to load answers for grading', 500);
    }

    const answerByQuestion = new Map(
      (answers ?? []).map((a: { question_id: string; selected_option_id: string | null }) => [
        a.question_id,
        a.selected_option_id,
      ])
    );

    let marksObtained = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    for (const q of questions as {
      id: string;
      marks: number;
      question_options: { id: string; is_correct: boolean }[];
    }[]) {
      totalMarks += q.marks;
      const selected = answerByQuestion.get(q.id);
      const correctOption = q.question_options.find((o) => o.is_correct);

      if (!selected) {
        unansweredCount += 1;
        continue;
      }
      if (correctOption && selected === correctOption.id) {
        correctCount += 1;
        marksObtained += q.marks;
      } else {
        wrongCount += 1;
      }
    }

    const { data: exam } = await supabaseAdmin
      .from('exams')
      .select('passing_percentage')
      .eq('id', attempt.exam_id)
      .single();

    const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
    const passStatus =
      percentage >= (exam?.passing_percentage ?? 100) ? 'pass' : 'fail';

    const { data: result, error: resultError } = await supabaseAdmin
      .from('results')
      .insert({
        attempt_id,
        marks_obtained: marksObtained,
        total_marks: totalMarks,
        percentage: Math.round(percentage * 100) / 100,
        correct_count: correctCount,
        wrong_count: wrongCount,
        unanswered_count: unansweredCount,
        pass_status: passStatus,
      })
      .select()
      .single();

    if (resultError) {
      return jsonError('Failed to save result', 500);
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'exam_submitted',
      entity: 'exam_attempts',
      entity_id: attempt_id,
      metadata: { exam_id: attempt.exam_id, status: finalStatus, percentage },
    });

    return jsonOk({ result });
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
