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

    const getSystemPrompt = (lang: string) => {
      switch (lang) {
        case 'telugu':
          return `మీరు ఒక వ్యవసాయ నిపుణుడు. ఈ చిత్రాన్ని విశ్లేషించండి. వ్యవసాయానికి సంబంధించిన చిత్రం అయితే, దయచేసి తెలుగులో ఒక నివేదికను క్రింది బోల్డ్ మార్క్‌డౌన్ హెడింగ్‌లతో అందించండి:\n\n- **పంట పేరు:**\n- **పరిస్థితి:**\n- **వ్యాధి లేదా ఒత్తిడి:**\n- **లక్షణాలు:**\n- **దశ:**\n- **సిఫార్సులు:**\n\nప్రతి విభాగాన్ని స్పష్టంగా బోల్డ్ చేయండి. వ్యవసాయానికి సంబంధించినది కాకపోతే, తెలుగులో ఇలా ప్రత్యుత్తరం ఇవ్వండి: "దయచేసి వ్యవసాయానికి సంబంధించిన చిత్రం మాత్రమే ఎంచుకోండి."\n\nమీరు తప్పనిసరిగా తెలుగులో మాత్రమే ప్రత్యుత్తరం ఇవ్వాలి.`;
        case 'hindi':
          return `आप एक कृषि विशेषज्ञ हैं। इस छवि का विश्लेषण करें। यदि छवि खेती से संबंधित है, तो कृपया निम्नलिखित बोल्ड मार्कडाउन शीर्षकों के साथ हिंदी में एक रिपोर्ट प्रदान करें:\n\n- **फ़सल का नाम:**\n- **स्थिति:**\n- **रोग या तनाव:**\n- **लक्षण:**\n- **अवस्था:**\n- **सिफारिशें:**\n\nप्रत्येक अनुभाग को स्पष्ट रूप से बोल्ड करें। यदि छवि खेती से संबंधित नहीं है, तो हिंदी में जवाब दें: "कृपया केवल खेती से संबंधित छवियाँ अपलोड करें।"\n\nआपको केवल हिंदी में ही जवाब देना होगा।`;
        default: // English
          return `You are an agricultural expert. Analyze this image. If the image is farming-related, please provide a report in English with the following bold markdown headings:\n\n- **Crop Name:**\n- **Condition:**\n- **Disease or Stress Identified:**\n- **Symptoms:**\n- **Stage:**\n- **Recommendations:**\n\nClearly bold each section. If the image is not farming-related, respond in English: "Please upload only farming-related images."\n\nYou must respond only in English.`;
      }
    };

    const systemPrompt = getSystemPrompt(language);

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
