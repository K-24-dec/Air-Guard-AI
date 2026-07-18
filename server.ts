import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashes if key is missing on startup
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. SSE Streaming Chat Assistant Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = getGeminiClient();

    // Set SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history: chatHistory,
      config: {
        systemInstruction: `You are AirGuard AI's friendly environmental assistant, a highly knowledgeable environmental scientist and meteorologist.
Your goal is to provide accurate, interesting, and easy-to-understand insights on air quality, weather, health hazards, and environmental policies.
Always format your responses elegantly using standard markdown.
Keep responses engaging, conversational, and actionable. Avoid robotic language or telemetry-like larping.
Topics you cover: Air Quality Index (AQI), PM2.5, PM10, ozone, carbon monoxide, nitrogen dioxide, health effects for sensitive groups, safe outdoor activities, pollution prevention tips, climate change, carbon footprint reduction, and how the AirGuard AI dashboard features work.`,
      },
    });

    const resultStream = await chat.sendMessageStream({ message });

    for await (const chunk of resultStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Chat error:", err);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message || "Failed to generate stream response" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message || "Failed to initiate chat response" });
    }
  }
});

// 3. Structured AI Insights Endpoint
app.post("/api/insights", async (req, res) => {
  try {
    const { aqi, pollutants, weather, forecast } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate comprehensive air quality insights and environmental recommendations based on the following local data:
Current AQI: ${aqi}
Pollutants: ${JSON.stringify(pollutants || { pm25: 15, pm10: 25, o3: 30, no2: 12, co: 0.4, so2: 5 })}
Weather Conditions: ${JSON.stringify(weather || { temp: 22, humidity: 60, windSpeed: 10, windDirection: "NE" })}
Forecast/Trend Data: ${JSON.stringify(forecast || [])}

Instructions:
1. Provide a concise Daily Summary like: "Today's AQI is Moderate. Outdoor activities are generally safe, but sensitive groups should limit prolonged exposure."
2. Provide a detailed AQI Explainer highlighting what factors are driving the current AQI levels, what pollutants are dominant, and custom actions to take.
3. Provide personalized advice for: General Public, Children, Elderly, Pregnant Women, Athletes, and Asthma Patients.
4. Analyze weekly trends and environmental effects.
5. Explain future AQI predictions based on meteorological factors (wind speed, temperature, pressure changes) and assign a realistic AI confidence level (e.g. 85%).
6. Generate a single highly relevant daily Eco Tip.
7. Prepare a specific "emergencyMode" object: if AQI is High/Severe (>150) or if requested, isSevere is true, and provide a direct warning banner message with 3 stay-indoor precautions. Otherwise isSevere is false.

Return the response in JSON complying strictly with the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailySummary: { type: Type.STRING },
            aqiExplainer: { type: Type.STRING },
            healthAdvisor: {
              type: Type.OBJECT,
              properties: {
                general: { type: Type.STRING },
                children: { type: Type.STRING },
                elderly: { type: Type.STRING },
                pregnant: { type: Type.STRING },
                athletes: { type: Type.STRING },
                asthma: { type: Type.STRING },
              },
              required: ["general", "children", "elderly", "pregnant", "athletes", "asthma"],
            },
            weeklyReport: { type: Type.STRING },
            predictionExplanation: { type: Type.STRING },
            ecoTip: { type: Type.STRING },
            emergencyMode: {
              type: Type.OBJECT,
              properties: {
                isSevere: { type: Type.BOOLEAN },
                warningBanner: { type: Type.STRING },
                precautions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["isSevere", "warningBanner", "precautions"],
            },
          },
          required: ["dailySummary", "aqiExplainer", "healthAdvisor", "weeklyReport", "predictionExplanation", "ecoTip", "emergencyMode"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text generated from Gemini");
    }

    res.json(JSON.parse(resultText));
  } catch (err: any) {
    console.error("Insights generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI insights" });
  }
});

// Serve frontend assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static built assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AirGuard AI] Server listening on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
