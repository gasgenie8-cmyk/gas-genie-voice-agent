// Supabase Edge Function: analyze-photo
// Deploy with: supabase functions deploy analyze-photo
// Set secret: supabase secrets set GEMINI_API_KEY=your-key-here

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Gas Genie, an expert UK gas engineer and plumber with decades of experience. 
You are analysing a photo taken on-site by a gas engineer or plumber.

Your task is to identify:
1. Any error codes displayed on boiler/appliance screens
2. Installation defects or compliance issues  
3. Equipment condition and faults
4. Safety concerns

You MUST respond in this exact JSON format:
{
  "diagnosis": "Clear description of what you see and the likely issue",
  "severity": "low" | "medium" | "high" | "critical",
  "possible_causes": ["cause 1", "cause 2", "cause 3"],
  "next_steps": ["step 1", "step 2", "step 3"],
  "safety_warning": "Any safety warnings, or null if none",
  "confidence": 0.0 to 1.0
}

Rules:
- Always refer to UK Gas Safety Regulations
- If you see a gas leak indication, set severity to "critical" and safety_warning to "If you smell gas, call the National Gas Emergency Service: 0800 111 999"
- Reference specific boiler models/brands when identifiable
- Be specific about error codes (e.g. "E119 on Vaillant ecoTEC = ignition failure")
- If the image is unclear, set confidence low and say so in the diagnosis
- Always include practical next steps a qualified engineer would take`

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { photo_url, user_id } = await req.json()

        if (!photo_url) {
            return new Response(
                JSON.stringify({ error: 'photo_url is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch the image and convert to base64
        const imageResponse = await fetch(photo_url)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

        // Call Gemini Vision API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: SYSTEM_PROMPT },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Image,
                                },
                            },
                            { text: 'Analyse this photo and provide your diagnosis in the JSON format specified. Only return the JSON, no other text.' },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        )

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            console.error('Gemini API error:', errorText)
            return new Response(
                JSON.stringify({ error: 'AI analysis failed' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const geminiData = await geminiResponse.json()
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Parse the JSON response
        let analysis
        try {
            // Try to extract JSON from the response (handles markdown code blocks)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/)
            analysis = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
        } catch {
            analysis = {
                diagnosis: responseText || 'Unable to analyse this image. Please try a clearer photo.',
                severity: 'low',
                possible_causes: [],
                next_steps: ['Try uploading a clearer photo', 'Ensure the subject is well-lit'],
                safety_warning: null,
                confidence: 0.2,
            }
        }

        // Save to database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        if (user_id) {
            await supabase.from('photo_analyses').insert({
                user_id,
                photo_url,
                analysis,
                model_used: 'gemini-2.0-flash',
            })
        }

        return new Response(
            JSON.stringify(analysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
