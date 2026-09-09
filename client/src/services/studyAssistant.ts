import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const aiClient = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function askStudyAssistant(
  question: string,
  history: AssistantMessage[],
): Promise<{ reply: string; assistant: boolean }> {
  const session = aiClient ? await aiClient.auth.getSession() : null
  const token = session?.data.session?.access_token
  if (!token) {
    return { assistant: false, reply: 'Sign in again to use the assistant.' }
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/study-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, history: history.slice(-12) }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  const data = (await res.json()) as { reply: string; assistant: boolean }
  return { reply: data.reply, assistant: data.assistant }
}