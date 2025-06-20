import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, language } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing voice input:', { text, language })

    // Prepare prompt based on language
    let systemPrompt = '';
    if (language === 'telugu') {
      systemPrompt = `మీరు ఒక సహాయకరమైన AI అసిస్టెంట్. తెలుగులో సహజంగా మరియు స్నేహపూర్వకంగా సమాధానం ఇవ్వండి. సంక్షిప్తంగా మరియు ఉపయోగకరంగా సమాధానం ఇవ్వండి.`;
    } else if (language === 'hindi') {
      systemPrompt = `आप एक सहायक AI सहायक हैं। उत्तर केवल हिंदी में दें। हिंदी में स्वाभाविक और मित्रवत तरीके से उत्तर दें। उत्तर संक्षिप्त और उपयोगी रखें।`;
    } else {
      systemPrompt = `You are a helpful AI assistant. Respond naturally and friendly in English. Keep responses concise and helpful.`;
    }

    // Call Gemini 1.5 Flash API (updated model)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser question: ${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error('Failed to get AI response')
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.'

    console.log('Gemini response:', aiResponse)

    // Save to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('user_activity')
      .insert({
        query_type: 'voice',
        input_data: text,
        response: aiResponse,
        language: language,
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in process-voice function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
