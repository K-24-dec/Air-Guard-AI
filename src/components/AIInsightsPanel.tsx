import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Compass,
  HeartPulse,
  Activity,
  ShieldAlert,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  UserCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { AIInsights } from "../types";

interface AIInsightsPanelProps {
  insights: AIInsights | null;
  isLoading: boolean;
  onQuickAction: (prompt: string) => void;
  theme: "dark" | "light";
}

const HEALTH_GROUPS = [
  { id: "general", label: "General Public", icon: "👥" },
  { id: "children", label: "Children & Kids", icon: "👶" },
  { id: "elderly", label: "Elderly Care", icon: "🧓" },
  { id: "pregnant", label: "Pregnant Women", icon: "🤰" },
  { id: "athletes", label: "Athletes & Runners", icon: "🏃" },
  { id: "asthma", label: "Asthma Patients", icon: "🫁" },
];

const QUICK_ACTIONS = [
  { prompt: "Is it safe to go outside today?", label: "Safety Outdoor Check" },
  { prompt: "Explain today's AQI level causes", label: "AQI Breakdown" },
  { prompt: "Provide personalized medical advice", label: "Sensitive Groups Health Advice" },
  { prompt: "How to lower my personal carbon footprint?", label: "Eco-Friendly Action Tips" },
  { prompt: "Weekly regional air quality trends summary", label: "Weekly Trend Report" },
];

export default function AIInsightsPanel({
  insights,
  isLoading,
  onQuickAction,
  theme,
}: AIInsightsPanelProps) {
  const [activeGroupTab, setActiveGroupTab] = useState<string>("general");

  if (isLoading) {
    return (
      <div
        id="insights-skeleton-loader"
        className={`p-6 rounded-3xl border ${
          theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-natural-border shadow-sm animate-pulse"
        } space-y-6`}
      >
        <div className={`flex items-center justify-between border-b pb-4 ${theme === "dark" ? "border-slate-800/20" : "border-natural-border-darker"}`}>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 animate-spin ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
            <div className={`h-5 w-48 rounded ${theme === "dark" ? "bg-slate-700" : "bg-natural-surface"}`}></div>
          </div>
          <div className={`h-4 w-24 rounded ${theme === "dark" ? "bg-slate-700" : "bg-natural-surface"}`}></div>
        </div>

        <div className="space-y-3">
          <div className={`h-4 w-full rounded ${theme === "dark" ? "bg-slate-700" : "bg-natural-surface-light"}`}></div>
          <div className={`h-4 w-5/6 rounded ${theme === "dark" ? "bg-slate-700" : "bg-natural-surface-light"}`}></div>
          <div className={`h-4 w-2/3 rounded ${theme === "dark" ? "bg-slate-700" : "bg-natural-surface-light"}`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`h-28 rounded-xl border ${theme === "dark" ? "bg-slate-800/40 border-slate-800/40" : "bg-natural-surface-light border-natural-border"}`}></div>
          <div className={`h-28 rounded-xl border ${theme === "dark" ? "bg-slate-800/40 border-slate-800/40" : "bg-natural-surface-light border-natural-border"}`}></div>
        </div>
      </div>
    );
  }

  // Graceful offline fallback in case user hasn't generated insights yet or API failed
  if (!insights) {
    return (
      <div
        className={`p-6 rounded-3xl border text-center relative overflow-hidden transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}
      >
        <div className={`absolute -left-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-10 ${theme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></div>
        <Sparkles className={`w-10 h-10 mx-auto mb-3 animate-bounce ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
        <h3 className={`font-bold text-md mb-2 ${theme === "dark" ? "text-slate-100" : "text-natural-dark"}`}>No AI Analysis Generated Yet</h3>
        <p className={`text-xs max-w-md mx-auto mb-5 leading-relaxed ${theme === "dark" ? "opacity-75" : "text-natural-slate font-medium"}`}>
          Slide the simulator values to map a custom environment, then click the **"Generate AI Analysis"** button above to compile intelligent medical, environmental, and forecasting insights using the Gemini API.
        </p>

        {/* Quick Actions Panel anyway */}
        <div className={`text-left border-t pt-5 ${theme === "dark" ? "border-slate-800/20" : "border-natural-border-darker"}`}>
          <span className={`text-[10px] uppercase tracking-wider font-bold block mb-3 ${
            theme === "dark" ? "opacity-60" : "text-natural-muted"
          }`}>
            Quick Actions • Ask the Chatbot Directly
          </span>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                onClick={() => onQuickAction(qa.prompt)}
                className={`text-xs py-2 px-3.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition shadow-xs ${
                  theme === "dark"
                    ? "border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 text-slate-300"
                    : "border-natural-border bg-natural-surface hover:bg-natural-surface-light hover:border-natural-border-darker text-natural-text"
                }`}
              >
                <span>{qa.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    dailySummary,
    aqiExplainer,
    healthAdvisor,
    weeklyReport,
    predictionExplanation,
    ecoTip,
    emergencyMode,
  } = insights;

  const currentAdvisorText =
    healthAdvisor[activeGroupTab as keyof typeof healthAdvisor] || healthAdvisor.general;

  return (
    <div className="space-y-6" id="ai-insights-panel">
      {/* 7. EMERGENCY MODE WARNING BANNER */}
      {emergencyMode.isSevere && (
        <div className={`p-4 border rounded-3xl flex items-start gap-3.5 shadow-lg animate-pulse ${
          theme === "dark"
            ? "bg-rose-600/15 border-rose-500/30 text-rose-400 shadow-rose-950/15"
            : "bg-rose-50 border-rose-300 text-rose-900 shadow-rose-800/5"
        }`}>
          <ShieldAlert className={`w-6 h-6 shrink-0 mt-0.5 ${theme === "dark" ? "text-rose-500" : "text-rose-700"}`} />
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider mb-1">
              AI Emergency Warning Mode Active
            </h4>
            <p className={`text-xs leading-relaxed mb-2 ${theme === "dark" ? "text-slate-200" : "text-rose-950 font-medium"}`}>
              {emergencyMode.warningBanner}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {emergencyMode.precautions.map((prec, idx) => (
                <div
                  key={idx}
                  className={`border p-2 rounded-xl text-[10px] flex items-center gap-1.5 ${
                    theme === "dark"
                      ? "bg-rose-950/45 border-rose-800/35 text-slate-200"
                      : "bg-rose-100/70 border-rose-200 text-rose-900 font-bold"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-rose-500" : "bg-rose-700"}`}></span>
                  {prec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. AI DAILY SUMMARY */}
      <div className={`p-5 rounded-3xl border relative overflow-hidden transition shadow-sm ${
        theme === "dark"
          ? "bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border-slate-800 text-white"
          : "bg-white border-natural-border text-natural-text"
      }`}>
        <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-2xl opacity-10 ${theme === "dark" ? "bg-indigo-500" : "bg-natural-accent"}`}></div>
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className={`w-4.5 h-4.5 ${theme === "dark" ? "text-indigo-400" : "text-natural-accent"}`} />
          <h3 className={`font-bold text-xs uppercase tracking-wider ${theme === "dark" ? "text-indigo-400" : "text-natural-accent-hover"}`}>
            Intelligent Daily Summary
          </h3>
        </div>
        <p className={`text-sm font-semibold leading-relaxed ${theme === "dark" ? "text-sky-400" : "text-natural-dark"}`}>
          {dailySummary}
        </p>
      </div>

      {/* TWO COLUMN GRID FOR MAJOR FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. AI AQI EXPLAINER */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent-hover"}`}>
              <Activity className={`w-4 h-4 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} /> AQI Explainer & Pollutant Factors
            </h4>
            <p className={`text-xs leading-relaxed whitespace-pre-line ${theme === "dark" ? "opacity-90" : "text-natural-text font-medium"}`}>
              {aqiExplainer}
            </p>
          </div>
        </div>

        {/* 5. AI PREDICTION EXPLANATION */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent-hover"}`}>
              <Compass className={`w-4 h-4 ${theme === "dark" ? "text-emerald-400" : "text-natural-accent"}`} /> Meteorological Prediction Explanation
            </h4>
            <p className={`text-xs leading-relaxed whitespace-pre-line ${theme === "dark" ? "opacity-90" : "text-natural-text font-medium"}`}>
              {predictionExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* 1. AI HEALTH ADVISOR (Interactive tabbed dashboard) */}
      <div className={`p-5 rounded-3xl border transition shadow-sm ${
        theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>
          <HeartPulse className={`w-4.5 h-4.5 ${theme === "dark" ? "text-pink-400" : "text-pink-600"}`} />
          Interactive Medical Health Advisor
        </h4>

        {/* Tabs row */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {HEALTH_GROUPS.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setActiveGroupTab(grp.id)}
              className={`text-xs py-2 px-3 rounded-xl border cursor-pointer whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                activeGroupTab === grp.id
                  ? theme === "dark"
                    ? "bg-pink-500/15 border-pink-500/45 text-pink-400 font-bold"
                    : "bg-pink-100 border-pink-300 text-pink-800 font-bold"
                  : theme === "dark"
                  ? "border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 text-slate-300"
                  : "border-natural-border bg-natural-surface hover:bg-natural-surface-light hover:border-natural-border-darker text-natural-text font-medium"
              }`}
            >
              <span>{grp.icon}</span>
              <span>{grp.label}</span>
            </button>
          ))}
        </div>

        {/* Tab display card */}
        <div className={`p-4 rounded-2xl border mt-3 transition shadow-inner ${
          theme === "dark" ? "bg-slate-950/70 border-slate-800" : "bg-natural-surface-light border-natural-border-darker text-natural-dark"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 mt-0.5 ${theme === "dark" ? "bg-pink-500/10" : "bg-white shadow-xs border border-natural-border-darker"}`}>
              {HEALTH_GROUPS.find((g) => g.id === activeGroupTab)?.icon}
            </div>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${theme === "dark" ? "text-pink-400" : "text-pink-700"}`}>
                Personalized Recommendation
              </span>
              <p className={`text-xs leading-relaxed mt-1 whitespace-pre-line ${theme === "dark" ? "text-slate-300" : "text-natural-text font-medium"}`}>
                {currentAdvisorText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: WEEKLY REPORT & ECO TIPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. AI WEEKLY REPORT */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent-hover"}`}>
              <TrendingUp className={`w-4 h-4 ${theme === "dark" ? "text-violet-400" : "text-natural-accent"}`} /> Regional Weekly Analysis
            </h4>
            <p className={`text-xs leading-relaxed whitespace-pre-line ${theme === "dark" ? "opacity-90" : "text-natural-text font-medium"}`}>
              {weeklyReport}
            </p>
          </div>
        </div>

        {/* 6. AI ECO TIPS */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent-hover"}`}>
              <Lightbulb className={`w-4 h-4 ${theme === "dark" ? "text-yellow-400" : "text-amber-600"}`} /> Daily Carbon Footprint & Eco Tip
            </h4>
            <div className="flex items-start gap-3 mt-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 ${theme === "dark" ? "bg-yellow-500/10" : "bg-natural-surface border border-natural-border"}`}>
                🌱
              </div>
              <p className={`text-xs leading-relaxed whitespace-pre-line italic ${theme === "dark" ? "text-slate-300" : "text-natural-dark font-medium"}`}>
                "{ecoTip}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. AI QUICK ACTIONS (One-click triggers) */}
      <div className={`p-5 rounded-3xl border transition shadow-sm ${
        theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
      }`}>
        <span className={`text-[10px] uppercase tracking-wider font-bold block mb-3.5 flex items-center gap-1 ${
          theme === "dark" ? "opacity-60" : "text-natural-muted"
        }`}>
          <HelpCircle className={`w-4 h-4 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} /> Quick Actions • Feed Directly to AI Chatbot
        </span>
        <div className="flex flex-wrap gap-2.5">
          {QUICK_ACTIONS.map((qa, i) => (
            <button
              key={i}
              onClick={() => onQuickAction(qa.prompt)}
              className={`text-xs py-2.5 px-4 rounded-xl border flex items-center gap-2 cursor-pointer transition shadow-xs ${
                theme === "dark"
                  ? "border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 text-slate-200"
                  : "border-natural-border bg-natural-surface hover:bg-natural-surface-light hover:border-natural-border-darker text-natural-text font-semibold shadow-sm"
              }`}
            >
              <span>{qa.label}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
