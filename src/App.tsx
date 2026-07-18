import { useState, useEffect } from "react";
import {
  Sparkles,
  Info,
  Sun,
  Moon,
  Wind,
  AlertTriangle,
  Bot,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import AIAssistant from "./components/AIAssistant";
import AQIDashboard from "./components/AQIDashboard";
import AIInsightsPanel from "./components/AIInsightsPanel";
import { Pollutants, Weather, ForecastDay, AIInsights } from "./types";

// Static default expert pre-compiled insights for immediate loading speed
const DEFAULT_OFFLINE_INSIGHTS: AIInsights = {
  dailySummary: "Today's Air Quality index is Moderate (55). While air quality is satisfactory, sensitive groups should consider taking breaks during long outdoor exercises.",
  aqiExplainer: "The index is driven by mild PM2.5 particulate levels at 14 µg/m³. Calm prevailing northeasterly breezes are slowly dispersing urban traffic emissions, which are slightly trapped near the surface due to ambient humidity.",
  healthAdvisor: {
    general: "Outdoor activities are fully safe. Enjoy standard walks, jogs, and recreational outdoor exercises without restrictions.",
    children: "Perfectly safe to play outside. Regular playground hours and sports activities can proceed normally.",
    elderly: "Air quality is acceptable. No active restrictions, but take breaks if you experience minor throat or nose tickles.",
    pregnant: "Safe conditions. Outdoor walks and breathing exercises are highly recommended.",
    athletes: "Safe to train and cycle outdoors. Monitor your respiratory rate as usual.",
    asthma: "Slight particulate presence may cause minor sensitivity. Keep reliever inhalers nearby if doing high-intensity cardio.",
  },
  weeklyReport: "A stable meteorological high-pressure ridge will maintain moderate AQI ranges. Expect clean dispersion by Friday as wind speeds increase, shifting indexes towards 'Good'.",
  predictionExplanation: "Stable temperatures (22°C) and constant humidity (60%) indicate low particulate stagnation. Future projections remain safely in the 50-65 range with high AI confidence (88%).",
  ecoTip: "Ditch active single-occupancy vehicle travel for short trips today. Walking, cycling, or using public transport keeps local particulate matter low!",
  emergencyMode: {
    isSevere: false,
    warningBanner: "",
    precautions: [],
  },
};

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [aqi, setAqi] = useState<number>(55);
  const [weather, setWeather] = useState<Weather>({
    temp: 22,
    humidity: 60,
    windSpeed: 10,
    windDirection: "NE",
  });
  const [pollutants, setPollutants] = useState<Pollutants>({
    pm25: 14,
    pm10: 25,
    o3: 32,
    no2: 12,
    co: 0.4,
    so2: 5,
  });

  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(DEFAULT_OFFLINE_INSIGHTS);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Auto-generate dynamic weather forecast whenever AQI changes
  useEffect(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIdx = new Date().getDay();
    const newForecast: ForecastDay[] = [];

    for (let i = 0; i < 7; i++) {
      const dayName = days[(todayIdx + i) % 7];
      // Slightly fluctuate simulated forecast around the active simulated AQI
      const variation = Math.sin(i * 1.3) * (aqi * 0.18) + (Math.random() - 0.5) * 8;
      const dayAqi = Math.max(10, Math.round(aqi + variation));

      newForecast.push({
        day: i === 0 ? "Today" : dayName,
        aqi: Math.min(500, dayAqi),
        temp: Math.round(weather.temp + Math.sin(i) * 2.5 + (Math.random() - 0.5) * 1.5),
        humidity: Math.round(Math.min(100, Math.max(10, weather.humidity + Math.cos(i) * 6))),
      });
    }
    setForecast(newForecast);
  }, [aqi, weather.temp, weather.humidity]);

  // Request actual Gemini API generated insights based on current simulated data
  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true);
    setStatusNotification("Connecting to Gemini atmospheric models...");

    try {
      // Simulate stepped progress loaders for engaging feedback
      setTimeout(() => setStatusNotification("Analyzing particulate exposure risk matrix..."), 800);
      setTimeout(() => setStatusNotification("Running geographical wind dispersion maps..."), 1500);

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aqi,
          pollutants,
          weather,
          forecast,
        }),
      });

      if (!response.ok) {
        throw new Error("Gemini server is initializing or key is missing. Reverting to expert offline models.");
      }

      const data = await response.json();
      setInsights(data);
      setStatusNotification(null);
    } catch (err: any) {
      console.warn("AI Insights Generation Fallback:", err);
      // Construct a localized, slightly adjusted fallback object matching exact simulation values
      // This ensures 100% stable performance and zero screen freezes
      const localAqiLevel = aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for Sensitive Groups" : "Severe/Hazardous";
      const customFallback: AIInsights = {
        ...DEFAULT_OFFLINE_INSIGHTS,
        dailySummary: `[Offline Analysis Mode] Today's Air Quality is simulated as ${localAqiLevel} (${aqi}). Current atmospheric temperature is ${weather.temp}°C under ${weather.humidity}% humidity.`,
        emergencyMode: {
          isSevere: aqi > 150,
          warningBanner: `⚠️ High pollution alert! Outdoor simulated AQI is at a dangerous level (${aqi}). Avoid heavy training.`,
          precautions: ["Stay indoors in air-conditioned rooms", "Run air purifiers with HEPA filters", "Wear N95 respiratory masks if going outside is necessary"],
        },
      };
      setInsights(customFallback);
      setStatusNotification("Using pre-compiled environmental analysis. (Gemini API key is pending configuration).");
      setTimeout(() => setStatusNotification(null), 5000);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Bridge Quick Action Prompts into the Floating Assistant Chatbot
  const handleQuickAction = (prompt: string) => {
    const fabButton = document.getElementById("ai-assistant-fab");
    if (fabButton) {
      fabButton.click(); // Trigger FAB to open the widget
    }
    // Prefill and trigger sendMessage inside the chatbot ref/state by custom window dispatch event
    setTimeout(() => {
      const chatInput = document.querySelector("#ai-assistant-window input");
      if (chatInput) {
        // Set input value
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(chatInput, prompt);
        // Trigger synthetic input event
        const ev = new Event("input", { bubbles: true });
        chatInput.dispatchEvent(ev);
        // Find send button and click
        const sendBtn = document.querySelector("#ai-assistant-window button[disabled='false']") ||
                        document.querySelector("#ai-assistant-window button:last-child");
        if (sendBtn) {
          (sendBtn as HTMLButtonElement).click();
        }
      }
    }, 450);
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        theme === "dark"
          ? "bg-slate-950 text-slate-100 selection:bg-sky-500/30 selection:text-white"
          : "bg-natural-bg text-natural-text selection:bg-natural-accent/20 selection:text-natural-dark"
      }`}
    >
      {/* 7. EMERGENCY STICKY WARNING HEADER FOR SEVERE AQI */}
      {aqi > 150 && (
        <div className={`text-center py-2 px-4 flex items-center justify-center gap-2 text-xs font-bold shadow-md z-40 sticky top-0 animate-pulse ${
          theme === "dark"
            ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white"
            : "bg-rose-700 text-white"
        }`}>
          <ShieldAlert className="w-4.5 h-4.5 animate-spin-slow" />
          <span>ENVIRONMENTAL ADVISORY: Severe Air Pollution Detected (AQI: {aqi}). Limit physical outdoor activities.</span>
          <button
            onClick={() => handleQuickAction("What are precautions for severe air quality?")}
            className="underline hover:text-slate-200 ml-2 font-extrabold flex items-center gap-0.5 cursor-pointer"
          >
            Guide Precautions <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <header className={`flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b gap-4 transition-colors duration-300 ${
          theme === "dark" ? "border-slate-800/20" : "border-natural-border"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${
              theme === "dark"
                ? "bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-400 shadow-sky-500/10"
                : "bg-natural-accent text-white"
            }`}>
              <Wind className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-2 ${
                theme === "dark" ? "text-slate-100" : "text-natural-dark"
              }`}>
                AirGuard AI
                <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  theme === "dark"
                    ? "bg-sky-500/10 text-sky-400 border-sky-400/20"
                    : "bg-natural-surface text-natural-accent border-natural-border-darker"
                }`}>
                  V1.2 Smart
                </span>
              </h1>
              <p className={`text-xs ${theme === "dark" ? "opacity-60" : "text-natural-slate font-medium"}`}>
                Intelligent Air Quality Forecasting & Health Exposure Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Location indicator */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              theme === "dark"
                ? "bg-slate-900 border border-slate-800 text-slate-300"
                : "bg-natural-surface text-natural-accent border border-natural-border"
            }`}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Live: San Francisco, CA</span>
            </div>

            {/* Status indicators */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${
              theme === "dark"
                ? "border border-slate-800/10 text-sky-400"
                : "border border-natural-border bg-natural-surface-light text-natural-accent"
            }`}>
              <Bot className="w-3.5 h-3.5 animate-pulse" />
              <span>Gemini 3.5-Flash</span>
            </div>

            {/* Global Theme Toggle */}
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-900/60 text-yellow-400 hover:bg-slate-800 hover:text-yellow-300"
                  : "border-natural-border bg-white text-natural-accent hover:bg-natural-surface hover:text-natural-accent-hover shadow-sm"
              }`}
              title="Toggle Global Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Global Action Notifications Banner */}
        {statusNotification && (
          <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs ${
            theme === "dark"
              ? "bg-sky-500/10 border-sky-400/20 text-sky-400"
              : "bg-natural-surface border-natural-border-darker text-natural-accent"
          }`}>
            <div className={`w-2 h-2 rounded-full animate-ping ${theme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></div>
            <span className="font-semibold">{statusNotification}</span>
          </div>
        )}

        {/* Bento Grid layout */}
        <main className="space-y-8">
          {/* Section 1: Visual Interactive Monitoring Dashboard */}
          <section aria-label="Visual Interactive Dashboard">
            <AQIDashboard
              aqi={aqi}
              pollutants={pollutants}
              weather={weather}
              forecast={forecast}
              onUpdateData={({ aqi: a, pollutants: p, weather: w }) => {
                setAqi(a);
                setPollutants(p);
                setWeather(w);
              }}
              isGeneratingInsights={isLoadingInsights}
              onRequestInsights={handleGenerateInsights}
              theme={theme}
            />
          </section>

          {/* Section 2: AI Smart Analysis & Health Advisory Panel */}
          <section aria-label="Intelligent AI Analysis Insights">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-extrabold flex items-center gap-2 ${
                theme === "dark" ? "text-slate-100" : "text-natural-dark"
              }`}>
                <Sparkles className={`w-5 h-5 ${theme === "dark" ? "text-indigo-400" : "text-natural-accent"}`} />
                Intelligent Atmospheric Diagnosis
              </h2>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${
                theme === "dark" ? "opacity-60" : "text-natural-muted"
              }`}>
                8 AI-Powered Features
              </span>
            </div>

            <AIInsightsPanel
              insights={insights}
              isLoading={isLoadingInsights}
              onQuickAction={handleQuickAction}
              theme={theme}
            />
          </section>
        </main>

        {/* Footer info banner */}
        <footer className={`text-center pt-8 border-t opacity-60 text-[10px] ${
          theme === "dark" ? "border-slate-800/10 text-slate-500" : "border-natural-border text-natural-muted"
        }`}>
          <p>© 2026 AirGuard AI. Designed with Natural Tones. Built with Google AI Studio and Gemini 3.5-Flash.</p>
        </footer>
      </div>

      {/* Floating Chat Assistant Widget */}
      <AIAssistant
        currentAQI={aqi}
        currentWeatherSummary={`${weather.temp}°C, Wind ${weather.windSpeed} km/h ${weather.windDirection}`}
        onSelectAction={handleQuickAction}
      />
    </div>
  );
}
