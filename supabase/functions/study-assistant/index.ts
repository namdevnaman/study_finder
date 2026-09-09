import Anthropic from 'npm:@anthropic-ai/sdk@^0.124.0'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2.116.0'
import { corsHeaders } from '../_shared/cors.ts'

const SYSTEM_PROMPT = `You are the Study Group Finder campus assistant — a friendly peer tutor for college students.
Help with: study techniques, breaking down doubts, finding study partners, planning sessions, and using the app.
Be concise (under 160 words), warm, and practical. You can use short bullet lists. No markdown headers.`

// Lightweight offline fallback used when no Anthropic key is configured yet.
function offlineReply(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('time') || q.includes('schedule') || q.includes('procrastinat')) {
    return 'Here’s a simple study rhythm: study in 45–50 minute blocks with 10-minute breaks. Pick one subject per block, and close distractions. Then use Study Group Finder to book a group session for the subject you keep putting off — scheduled group time is the easiest fix for procrastination.'
  }
  if (q.includes('group') || q.includes('partner') || q.includes('buddy')) {
    return 'Great idea — group study sticks best when it’s small and structured. Create a group with 3–5 people, set a clear goal for each session (e.g. “finish DBMS normalization problems”), and assign a short recap at the end so everyone leaves with the same understanding.'
  }
  if (q.includes('doubts') || q.includes('doubt') || q.includes('stuck') || q.includes('can’t solve') || q.includes('help')) {
    return 'When you’re stuck, try to isolate the exact step that fails — write down what you’ve tried so far, then post it as a doubt in Discussions with the subject and topic. Classmates often answer faster than you expect, especially for common semester courses.'
  }
  if (q.includes('exam') || q.includes('test') || q.includes('midterm') || q.includes('final')) {
    return 'For exams: map the syllabus to 3–4 strong study sessions, one per topic group. In each session: 20 min recap, 40 min active problems, 15 min review. Add a session in the app per topic and you’ll see clear progress on your dashboard.'
  }
  return 'Setup tip: use the dashboard to keep upcoming sessions and recommended groups in one place. If you pin down a doubt in Discussions or join a group session for a subject in your interests, campus colleagues will be able to help you quickly. What specific subject or doubt are you working on?'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    )
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const question = String(body?.question ?? '').trim()
    if (!question) {
      return new Response(JSON.stringify({ error: 'Missing question' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const maxHistory = Array.isArray(body?.history) ? body.history.slice(-12) : []
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey) {
      return new Response(
        JSON.stringify({ assistant: false, reply: offlineReply(question) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        ...(maxHistory as { role: 'user' | 'assistant'; content: string }[]),
        { role: 'user', content: question },
      ],
    })

    const reply = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')
      .trim()

    return new Response(
      JSON.stringify({ assistant: true, reply: reply || 'Hmm, I couldn’t find a good answer for that. Try rephrasing!' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ assistant: false, reply: 'The assistant momentarily hiccuped. Please try again in a sec.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})