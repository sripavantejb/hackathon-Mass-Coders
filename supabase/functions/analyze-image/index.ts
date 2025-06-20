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
    const { imageData, fileName, language } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing farming image:', { fileName, language })

    // Enhanced prompt for farming-specific analysis
    const systemPrompt = language === 'telugu' 
      ? `మీరు ఒక వ్యవసాయ నిపుణుడు. ఈ చిత్రాన్ని విశ్లేషించండి. వ్యవసాయానికి సంబంధించిన చిత్రం అయితే, క్రింది bold markdown headingsతో report ఇవ్వండి:\n\n- **పంట పేరు:**\n- **పరిస్థితి:**\n- **వ్యాధి లేదా ఒత్తిడి:**\n- **లక్షణాలు:**\n- **దశ:**\n- **సిఫార్సులు:**\n\nప్రతి విభాగాన్ని స్పష్టంగా bold చేయండి. వ్యవసాయానికి సంబంధించినది కాకపోతే: "దయచేసి వ్యవసాయానికి సంబంధించిన చిత్రం మాత్రమే ఎంచుకోండి."\n\nMarkdown formatలో మాత్రమే సమాధానం ఇవ్వండి.`
      : `You are an agricultural expert. If the image is farming-related, analyze it and return a step-by-step, structured report in markdown with the following bolded section headings:\n\n- **Crop Name:**\n- **Condition:**\n- **Disease or Stress Identified:**\n- **Symptoms:**\n- **Stage:**\n- **Recommendations:**\n\nIf the image is not farming-related, respond: "Please upload only farming-related images (crops, soil, plants, diseases)."\n\nFormat your response in markdown, using bold for section headings.`;

    // Call Gemini 1.5 Flash API (updated model with vision support)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: systemPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini Vision API error:', error)
      throw new Error('Failed to analyze image')
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not analyze this image.'

    console.log('Gemini Vision response:', aiResponse)

    // Save to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('user_activity')
      .insert({
        query_type: 'image',
        input_data: fileName,
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
    console.error('Error in analyze-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
