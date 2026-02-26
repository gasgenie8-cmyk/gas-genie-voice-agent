import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Pinecone } from "@pinecone-database/pinecone";

admin.initializeApp();
const db = admin.firestore();

// ─────────────────────────────────────────────────
// 1. analyzePhoto — Gemini Vision photo diagnosis
// ─────────────────────────────────────────────────

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
- Always include practical next steps a qualified engineer would take`;

export const analyzePhoto = functions
    .region("europe-west2")
    .https.onCall(async (request) => {
        const { photo_url, user_id } = request.data;

        if (!photo_url) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "photo_url is required"
            );
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            throw new functions.https.HttpsError(
                "internal",
                "Gemini API key not configured"
            );
        }

        // Fetch the image and convert to base64
        const imageResponse = await fetch(photo_url);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

        // Call Gemini Vision API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: SYSTEM_PROMPT },
                                { inlineData: { mimeType, data: base64Image } },
                                {
                                    text: "Analyse this photo and provide your diagnosis in the JSON format specified. Only return the JSON, no other text.",
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error("Gemini API error:", errorText);
            throw new functions.https.HttpsError("internal", "AI analysis failed");
        }

        const geminiData = await geminiResponse.json();
        const responseText =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse the JSON response
        let analysis;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            analysis = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        } catch {
            analysis = {
                diagnosis:
                    responseText ||
                    "Unable to analyse this image. Please try a clearer photo.",
                severity: "low",
                possible_causes: [],
                next_steps: [
                    "Try uploading a clearer photo",
                    "Ensure the subject is well-lit",
                ],
                safety_warning: null,
                confidence: 0.2,
            };
        }

        // Save analysis to Firestore
        if (user_id) {
            await db.collection("photoAnalyses").add({
                user_id,
                photo_url,
                analysis,
                model_used: "gemini-2.0-flash",
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        return analysis;
    });

// ─────────────────────────────────────────────────
// 2. ragSearch — Pinecone vector search for regs
// ─────────────────────────────────────────────────

export const ragSearch = functions
    .region("europe-west2")
    .https.onCall(async (request) => {
        const { query } = request.data;

        if (!query) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "query is required"
            );
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

        if (!GEMINI_API_KEY || !PINECONE_API_KEY) {
            throw new functions.https.HttpsError(
                "internal",
                "API keys not configured"
            );
        }

        // 1. Generate embedding with Gemini
        const embedResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: query }] },
                    taskType: "RETRIEVAL_QUERY",
                }),
            }
        );

        if (!embedResponse.ok) {
            console.error("Embedding error:", await embedResponse.text());
            throw new functions.https.HttpsError(
                "internal",
                "Failed to generate embedding"
            );
        }

        const embedData = await embedResponse.json();
        const embedding = embedData.embedding?.values;

        if (!embedding) {
            throw new functions.https.HttpsError(
                "internal",
                "No embedding returned"
            );
        }

        // 2. Query Pinecone for similar regulation chunks
        const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
        const index = pc.index("regulations");

        const queryResult = await index.query({
            vector: embedding,
            topK: 5,
            includeMetadata: true,
        });

        const results = (queryResult.matches || []).map((match) => ({
            source: match.metadata?.source || "Unknown",
            section: match.metadata?.section || "",
            content: match.metadata?.content || "",
            relevance: Math.round((match.score || 0) * 100),
        }));

        return { results, search_type: "vector" };
    });

// ─────────────────────────────────────────────────
// 3. doeToolHandler — Vapi tool calls handler
// ─────────────────────────────────────────────────

export const doeToolHandler = functions
    .region("europe-west2")
    .https.onRequest(async (req, res) => {
        // CORS headers
        res.set("Access-Control-Allow-Origin", "*");
        res.set(
            "Access-Control-Allow-Headers",
            "authorization, x-client-info, content-type"
        );

        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        try {
            const { message } = req.body;

            if (!message?.toolCalls || message.toolCalls.length === 0) {
                res.status(400).json({ error: "No tool calls found" });
                return;
            }

            const toolCall = message.toolCalls[0];
            const toolName = toolCall.function?.name;
            const args = toolCall.function?.arguments
                ? JSON.parse(toolCall.function.arguments)
                : {};

            let resultContent = "";

            switch (toolName) {
                case "search_regulations": {
                    // Use ragSearch internally
                    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
                    const PINECONE_API_KEY = process.env.PINECONE_API_KEY;

                    if (GEMINI_API_KEY && PINECONE_API_KEY) {
                        const embedResp = await fetch(
                            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    model: "models/text-embedding-004",
                                    content: { parts: [{ text: args.query || "" }] },
                                    taskType: "RETRIEVAL_QUERY",
                                }),
                            }
                        );

                        if (embedResp.ok) {
                            const embedData = await embedResp.json();
                            const vector = embedData.embedding?.values;
                            if (vector) {
                                const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
                                const idx = pc.index("regulations");
                                const results = await idx.query({
                                    vector,
                                    topK: 3,
                                    includeMetadata: true,
                                });
                                resultContent = (results.matches || [])
                                    .map(
                                        (m) =>
                                            `[${m.metadata?.source}] ${m.metadata?.section}: ${m.metadata?.content}`
                                    )
                                    .join("\n\n");
                            }
                        }
                    }

                    if (!resultContent) {
                        resultContent =
                            "Regulation search is not available at this time.";
                    }
                    break;
                }
                case "log_job": {
                    await db.collection("jobs").add({
                        ...args,
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    resultContent = `Job logged: ${args.description || "New job"}`;
                    break;
                }
                case "log_hours": {
                    await db.collection("workHours").add({
                        ...args,
                        created_at: new Date().toISOString(),
                    });
                    resultContent = `Logged ${args.hours || 0} hours`;
                    break;
                }
                case "log_mileage": {
                    await db.collection("mileageLogs").add({
                        ...args,
                        created_at: new Date().toISOString(),
                    });
                    resultContent = `Logged ${args.miles || 0} miles`;
                    break;
                }
                default:
                    resultContent = `Unknown tool: ${toolName}`;
            }

            // Respond in Vapi tool-result format
            res.json({
                results: [
                    {
                        toolCallId: toolCall.id,
                        result: resultContent,
                    },
                ],
            });
        } catch (error) {
            console.error("DOE tool handler error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
