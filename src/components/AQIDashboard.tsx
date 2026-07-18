import { useState } from "react";
import {
  Wind,
  Thermometer,
  Droplets,
  Sliders,
  Activity,
  Calendar,
  TrendingUp,
  Gauge,
  Info,
  Sparkles,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Pollutants, Weather, ForecastDay } from "../types";

interface AQIDashboardProps {
  aqi: number;
  pollutants: Pollutants;
  weather: Weather;
  forecast: ForecastDay[];
  onUpdateData: (newData: {
    aqi: number;
    pollutants: Pollutants;
    weather: Weather;
  }) => void;
  isGeneratingInsights: boolean;
  onRequestInsights: () => void;
  theme: "dark" | "light";
}

// Predefined atmospheric profiles for easy simulation
const SIMULATION_PROFILES = [
  {
    name: "Clean Forest Air",
    aqi: 22,
    weather: { temp: 18, humidity: 55, windSpeed: 14, windDirection: "SW" },
    pollutants: { pm25: 4, pm10: 8, o3: 20, no2: 5, co: 0.1, so2: 1 },
  },
  {
    name: "Urban Smog Alert",
    aqi: 135,
    weather: { temp: 28, humidity: 45, windSpeed: 5, windDirection: "E" },
    pollutants: { pm25: 49, pm10: 75, o3: 85, no2: 45, co: 1.8, so2: 12 },
  },
  {
    name: "Industrial Outbreak",
    aqi: 210,
    weather: { temp: 24, humidity: 70, windSpeed: 3, windDirection: "N" },
    pollutants: { pm25: 160, pm10: 240, o3: 40, no2: 85, co: 3.2, so2: 38 },
  },
  {
    name: "Severe Dust Storm",
    aqi: 380,
    weather: { temp: 35, humidity: 20, windSpeed: 35, windDirection: "NW" },
    pollutants: { pm25: 320, pm10: 450, o3: 15, no2: 15, co: 0.8, so2: 4 },
  },
];

export default function AQIDashboard({
  aqi,
  pollutants,
  weather,
  forecast,
  onUpdateData,
  isGeneratingInsights,
  onRequestInsights,
  theme,
}: AQIDashboardProps) {
  const [showSimControls, setShowSimControls] = useState(true);

  // Get AQI Status details
  const getAQIStatus = (value: number) => {
    const isDark = theme === "dark";
    if (value <= 50) {
      return {
        label: "Good",
        color: isDark
          ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
          : "text-emerald-800 bg-emerald-100/80 border-emerald-300/60",
        ringColor: isDark ? "border-emerald-500" : "border-emerald-600/70",
        glow: isDark ? "shadow-emerald-500/20" : "shadow-emerald-600/10",
        bgGradient: isDark ? "from-emerald-500/10 to-teal-500/5" : "from-emerald-500/5 to-teal-500/2",
        text: "Air quality is satisfactory, and air pollution poses little or no risk.",
      };
    } else if (value <= 100) {
      return {
        label: "Moderate",
        color: isDark
          ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/30"
          : "text-amber-800 bg-amber-100/90 border-amber-300/60",
        ringColor: isDark ? "border-yellow-500" : "border-amber-500",
        glow: isDark ? "shadow-yellow-500/20" : "shadow-amber-500/10",
        bgGradient: isDark ? "from-yellow-500/10 to-orange-500/5" : "from-amber-500/5 to-orange-500/2",
        text: "Air quality is acceptable. However, there may be risk for sensitive individuals.",
      };
    } else if (value <= 150) {
      return {
        label: "Unhealthy for Sensitive Groups",
        color: isDark
          ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
          : "text-orange-800 bg-orange-100/90 border-orange-300/60",
        ringColor: isDark ? "border-orange-500" : "border-orange-500",
        glow: isDark ? "shadow-orange-500/20" : "shadow-orange-500/10",
        bgGradient: isDark ? "from-orange-500/10 to-red-500/5" : "from-orange-500/5 to-red-500/2",
        text: "Sensitive groups (children, elderly, asthma sufferers) may experience health effects.",
      };
    } else if (value <= 200) {
      return {
        label: "Unhealthy",
        color: isDark
          ? "text-red-400 bg-red-500/15 border-red-500/30"
          : "text-red-800 bg-red-100/90 border-red-300/60",
        ringColor: isDark ? "border-red-500" : "border-red-500",
        glow: isDark ? "shadow-red-500/20" : "shadow-red-500/10",
        bgGradient: isDark ? "from-red-500/10 to-pink-500/5" : "from-red-500/5 to-pink-500/2",
        text: "Everyone may begin to experience health effects; sensitive groups more seriously.",
      };
    } else if (value <= 300) {
      return {
        label: "Very Unhealthy",
        color: isDark
          ? "text-purple-400 bg-purple-500/15 border-purple-500/30"
          : "text-purple-800 bg-purple-100 border-purple-300/60",
        ringColor: isDark ? "border-purple-500" : "border-purple-500",
        glow: isDark ? "shadow-purple-500/20" : "shadow-purple-500/10",
        bgGradient: isDark ? "from-purple-500/10 to-violet-500/5" : "from-purple-500/5 to-violet-500/2",
        text: "Health alert: The risk of health effects is increased for everyone.",
      };
    } else {
      return {
        label: "Hazardous / Severe",
        color: isDark
          ? "text-rose-600 bg-rose-600/15 border-rose-600/30 animate-pulse"
          : "text-rose-800 bg-rose-100 border-rose-300 animate-pulse",
        ringColor: isDark ? "border-rose-600" : "border-rose-600",
        glow: isDark ? "shadow-rose-600/30" : "shadow-rose-600/15",
        bgGradient: isDark ? "from-rose-600/15 to-red-600/5" : "from-rose-600/5 to-red-600/2",
        text: "Emergency conditions! The entire population is highly likely to be affected.",
      };
    }
  };

  const status = getAQIStatus(aqi);

  // Handle individual slider updates
  const handleAQIChange = (newAqi: number) => {
    // Dynamically scale pollutants PM2.5 and PM10 to match simulated AQI reasonably
    const scale = newAqi / 100;
    const nextPollutants = {
      pm25: Math.round(Math.max(2, scale * 35)),
      pm10: Math.round(Math.max(5, scale * 60)),
      o3: Math.round(Math.max(10, scale * 50)),
      no2: Math.round(Math.max(4, scale * 30)),
      co: parseFloat((Math.max(0.1, scale * 0.8)).toFixed(1)),
      so2: Math.round(Math.max(1, scale * 10)),
    };
    onUpdateData({ aqi: newAqi, pollutants: nextPollutants, weather });
  };

  const handleWeatherChange = (key: keyof Weather, val: any) => {
    onUpdateData({
      aqi,
      pollutants,
      weather: { ...weather, [key]: val },
    });
  };

  const handlePollutantChange = (key: keyof Pollutants, val: number) => {
    const nextPollutants = { ...pollutants, [key]: val };
    // Recalculate AQI based on the worst pollutant ratio as a simplified mock calculation
    // Max ratio drives simulated AQI
    let newAqi = aqi;
    if (key === "pm25") {
      newAqi = Math.round(val * 2.8);
    } else if (key === "pm10") {
      newAqi = Math.round(val * 1.6);
    }
    onUpdateData({
      aqi: Math.min(500, Math.max(10, newAqi)),
      pollutants: nextPollutants,
      weather,
    });
  };

  const applyProfile = (prof: typeof SIMULATION_PROFILES[0]) => {
    onUpdateData({
      aqi: prof.aqi,
      pollutants: prof.pollutants,
      weather: prof.weather,
    });
  };

  // Safe limits description helper
  const getPollutantStatus = (name: string, value: number, safeLimit: number) => {
    const ratio = value / safeLimit;
    const isDark = theme === "dark";
    if (ratio <= 0.8) {
      return {
        text: "Optimal",
        style: isDark ? "text-emerald-400" : "text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full font-semibold"
      };
    }
    if (ratio <= 1.2) {
      return {
        text: "Acceptable",
        style: isDark ? "text-yellow-400 animate-pulse" : "text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-semibold"
      };
    }
    return {
      text: "Dangerous",
      style: isDark ? "text-red-400 font-semibold" : "text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full font-bold"
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="aqi-dashboard-grid">
      {/* LEFT COLUMN: Controls & Simulators (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Simulation Control Toggle Panel */}
        <div className={`p-5 rounded-3xl border transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Sliders className={`w-4.5 h-4.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
              Atmospheric Simulator
            </h2>
            <button
              onClick={() => setShowSimControls(!showSimControls)}
              className={`text-xs cursor-pointer hover:underline ${
                theme === "dark" ? "text-sky-400" : "text-natural-accent"
              }`}
            >
              {showSimControls ? "Hide sliders" : "Show sliders"}
            </button>
          </div>

          <p className={`text-xs mb-4 ${theme === "dark" ? "opacity-70" : "text-natural-slate font-medium"}`}>
            Test and simulate custom environmental scenarios to see how AirGuard AI's intelligent medical and meteorological analysis adjusts in real-time.
          </p>

          {/* Preset Profiles */}
          <div className="mb-5">
            <span className={`text-[10px] uppercase tracking-wider block mb-2 font-bold ${
              theme === "dark" ? "opacity-60" : "text-natural-muted"
            }`}>
              Scenario Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SIMULATION_PROFILES.map((prof, i) => (
                <button
                  key={i}
                  onClick={() => applyProfile(prof)}
                  className={`text-[11px] py-2 px-3 rounded-xl border text-left cursor-pointer transition ${
                    theme === "dark"
                      ? "border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 text-slate-200"
                      : "border-natural-border bg-natural-surface hover:bg-natural-surface-light hover:border-natural-border-darker text-natural-text shadow-sm"
                  }`}
                >
                  <div className={`font-bold ${theme === "dark" ? "text-slate-200" : "text-natural-dark"}`}>{prof.name}</div>
                  <div className={`text-[9px] ${theme === "dark" ? "opacity-60" : "text-natural-slate"}`}>AQI: {prof.aqi} • Temp: {prof.weather.temp}°C</div>
                </button>
              ))}
            </div>
          </div>

          {showSimControls && (
            <div className="space-y-4">
              {/* AQI Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Activity className={`w-3.5 h-3.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} /> Simulated AQI
                  </span>
                  <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{aqi}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={aqi}
                  onChange={(e) => handleAQIChange(parseInt(e.target.value))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                    theme === "dark" ? "bg-slate-700 accent-sky-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                  }`}
                />
              </div>

              {/* Weather inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 opacity-85">
                    <span className="font-medium">Temp (°C)</span>
                    <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{weather.temp}°</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="45"
                    value={weather.temp}
                    onChange={(e) => handleWeatherChange("temp", parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      theme === "dark" ? "bg-slate-700 accent-sky-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 opacity-85">
                    <span className="font-medium">Humidity (%)</span>
                    <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{weather.humidity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weather.humidity}
                    onChange={(e) => handleWeatherChange("humidity", parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      theme === "dark" ? "bg-slate-700 accent-sky-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                    }`}
                  />
                </div>
              </div>

              {/* Wind Speed and Direction */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 opacity-85">
                    <span className="font-medium">Wind (km/h)</span>
                    <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{weather.windSpeed}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={weather.windSpeed}
                    onChange={(e) => handleWeatherChange("windSpeed", parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      theme === "dark" ? "bg-slate-700 accent-sky-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                    }`}
                  />
                </div>
                <div>
                  <span className={`text-[10px] block mb-0.5 font-bold ${theme === "dark" ? "opacity-60" : "text-natural-muted"}`}>Wind Direction</span>
                  <select
                    value={weather.windDirection}
                    onChange={(e) => handleWeatherChange("windDirection", e.target.value)}
                    className={`w-full py-1.5 px-2 text-xs rounded-xl border focus:ring-1 focus:outline-none ${
                      theme === "dark"
                        ? "bg-slate-950 border-slate-800 text-white focus:ring-sky-500"
                        : "bg-white border-natural-border-darker text-natural-dark focus:ring-natural-accent"
                    }`}
                  >
                    <option value="N">North (N)</option>
                    <option value="NE">Northeast (NE)</option>
                    <option value="E">East (E)</option>
                    <option value="SE">Southeast (SE)</option>
                    <option value="S">South (S)</option>
                    <option value="SW">Southwest (SW)</option>
                    <option value="W">West (W)</option>
                    <option value="NW">Northwest (NW)</option>
                  </select>
                </div>
              </div>

              {/* Pollutants sliders */}
              <div className={`border-t pt-3 space-y-2 ${theme === "dark" ? "border-slate-800/40" : "border-natural-border-darker"}`}>
                <span className={`text-[10px] uppercase tracking-wider block font-bold ${
                  theme === "dark" ? "opacity-60" : "text-natural-muted"
                }`}>
                  Pollutant Micro-Controls
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-semibold text-natural-slate">PM2.5 (µg/m³)</span>
                      <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{pollutants.pm25}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="350"
                      value={pollutants.pm25}
                      onChange={(e) => handlePollutantChange("pm25", parseInt(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                        theme === "dark" ? "bg-slate-700 accent-teal-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-semibold text-natural-slate">PM10 (µg/m³)</span>
                      <span className={`font-bold ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>{pollutants.pm10}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="500"
                      value={pollutants.pm10}
                      onChange={(e) => handlePollutantChange("pm10", parseInt(e.target.value))}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                        theme === "dark" ? "bg-slate-700 accent-teal-400" : "bg-natural-surface-light accent-natural-accent border border-natural-border-darker"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trigger Analysis Button */}
          <button
            onClick={onRequestInsights}
            disabled={isGeneratingInsights}
            className={`w-full mt-4 py-3 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "dark"
                ? "bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/10"
                : "bg-natural-accent hover:bg-natural-accent-hover shadow-natural-accent/15"
            }`}
          >
            <Sparkles className={`w-4.5 h-4.5 ${isGeneratingInsights ? "animate-spin" : ""}`} />
            {isGeneratingInsights ? "Synthesizing AI Models..." : "Generate AI Analysis & Insights"}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: AQI metrics & Forecast (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Main Monitor Display */}
        <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border-slate-800 text-white"
            : "bg-natural-surface-light border-natural-border-darker text-natural-text"
        }`}>
          {/* Background Glow / Pattern */}
          {theme === "dark" ? (
            <div className={`absolute -right-20 -top-20 w-60 h-60 rounded-full blur-3xl opacity-15 bg-current ${status.ringColor}`}></div>
          ) : (
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(#4a7c59 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }}></div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Circular Gauge display */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Simulated outer border glow ring */}
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${theme === "dark" ? `opacity-20 ${status.ringColor}` : "opacity-30 border-natural-border-darker"}`}></div>
                {/* Main ring container */}
                <div className={`absolute inset-2 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${status.ringColor} ${status.glow} ${theme === "dark" ? "bg-slate-950/70 text-slate-100" : "bg-white text-natural-dark"}`}>
                  <span className={`text-4xl font-black tracking-tight ${theme === "dark" ? "font-mono" : "font-sans"}`}>{aqi}</span>
                  <span className={`text-[10px] uppercase tracking-widest mt-0.5 font-bold ${theme === "dark" ? "opacity-60" : "text-natural-accent"}`}>AQI</span>
                </div>
              </div>
            </div>

            {/* Current Air Index detail text */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs uppercase tracking-wider font-bold ${theme === "dark" ? "opacity-60" : "text-natural-muted"}`}>Live Quality Monitor</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed font-medium">{status.text}</p>

              {/* Weather summary row */}
              <div className={`flex gap-4 pt-2.5 border-t ${theme === "dark" ? "border-slate-800/20" : "border-natural-border-darker"}`}>
                <div className="flex items-center gap-1.5">
                  <Thermometer className={`w-4 h-4 ${theme === "dark" ? "text-orange-400" : "text-amber-600"}`} />
                  <span className="text-xs font-semibold">{weather.temp}°C</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className={`w-4 h-4 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
                  <span className="text-xs font-semibold">{weather.humidity}% Humidity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wind className={`w-4 h-4 ${theme === "dark" ? "text-teal-400" : "text-natural-slate"}`} />
                  <span className="text-xs font-semibold">
                    {weather.windSpeed} km/h • {weather.windDirection}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Recharts Prediction Trend */}
        <div className={`p-5 rounded-3xl border transition shadow-sm ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800 text-white" : "bg-white border-natural-border text-natural-text"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calendar className={`w-4.5 h-4.5 ${theme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
              7-Day Air Quality Forecast Trend
            </h3>
            <span className={`text-[10px] flex items-center gap-1 font-semibold ${theme === "dark" ? "opacity-60" : "text-natural-muted"}`}>
              <TrendingUp className={`w-3 h-3 ${theme === "dark" ? "text-emerald-400" : "text-natural-accent"} animate-pulse`} /> Meteorological Forecast
            </span>
          </div>

          <div className="h-44 w-full" id="forecast-recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === "dark" ? "#38bdf8" : "#4a7c59"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={theme === "dark" ? "#38bdf8" : "#4a7c59"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#e9ece2"} opacity={theme === "dark" ? 0.15 : 0.6} />
                <XAxis dataKey="day" stroke={theme === "dark" ? "#64748b" : "#8a9b8e"} fontSize={10} tickLine={false} />
                <YAxis stroke={theme === "dark" ? "#64748b" : "#8a9b8e"} fontSize={10} tickLine={false} domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#0f172a" : "#fdfcf9",
                    borderColor: theme === "dark" ? "#1e293b" : "#e9ece2",
                    borderRadius: "16px",
                    fontSize: "11px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}
                  itemStyle={{ color: theme === "dark" ? "#38bdf8" : "#4a7c59", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke={theme === "dark" ? "#38bdf8" : "#4a7c59"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAqi)"
                  name="AQI Index"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pollutants Concentrations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            {
              name: "PM2.5",
              fullName: "Fine Particulate Matter",
              val: pollutants.pm25,
              unit: "µg/m³",
              limit: 12,
              desc: "Microscopic dust from fuel combustion and traffic that bypasses throat filters.",
            },
            {
              name: "PM10",
              fullName: "Coarse Particulate",
              val: pollutants.pm10,
              unit: "µg/m³",
              limit: 54,
              desc: "Larger dust, pollen, mold, and industrial crushed materials.",
            },
            {
              name: "Ozone (O₃)",
              fullName: "Ground Ozone",
              val: pollutants.o3,
              unit: "ppb",
              limit: 70,
              desc: "Gaseous compound triggered when warm sunlight reacts with tailpipe emissions.",
            },
            {
              name: "NO₂",
              fullName: "Nitrogen Dioxide",
              val: pollutants.no2,
              unit: "ppb",
              limit: 100,
              desc: "Highly reactive exhaust gas causing direct lung inflammation and asthma flares.",
            },
            {
              name: "CO",
              fullName: "Carbon Monoxide",
              val: pollutants.co,
              unit: "ppm",
              limit: 9.0,
              desc: "Colorless, odorless gas emitted by combustion engines blocking oxygen flow.",
            },
            {
              name: "SO₂",
              fullName: "Sulfur Dioxide",
              val: pollutants.so2,
              unit: "ppb",
              limit: 75,
              desc: "Corrosive volcanic and power-plant gas forming toxic secondary sulfates.",
            },
          ].map((pol, i) => {
            const safety = getPollutantStatus(pol.name, pol.val, pol.limit);
            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all duration-200 group relative shadow-xs ${
                  theme === "dark"
                    ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-white"
                    : "bg-white border-natural-border hover:border-natural-border-darker hover:shadow-md text-natural-text"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-bold text-xs ${theme === "dark" ? "text-slate-100" : "text-natural-dark"}`}>{pol.name}</span>
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${safety.style}`}>
                      {safety.text}
                    </span>
                  </div>
                  <p className={`text-[10px] mb-2 truncate ${theme === "dark" ? "opacity-50" : "text-natural-muted font-medium"}`}>{pol.fullName}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-extrabold ${theme === "dark" ? "font-mono" : "font-sans"}`}>{pol.val}</span>
                    <span className={`text-[10px] font-semibold ${theme === "dark" ? "opacity-60" : "text-natural-slate"}`}>{pol.unit}</span>
                  </div>
                </div>

                <div className={`text-[9px] mt-2.5 flex items-center gap-1 font-medium ${theme === "dark" ? "opacity-45" : "text-natural-slate"}`}>
                  <Info className={`w-3 h-3 ${theme === "dark" ? "group-hover:text-sky-400" : "group-hover:text-natural-accent"}`} /> Limit: {pol.limit} {pol.unit}
                </div>

                {/* Info Tooltip Hover Display */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl shadow-xl text-[10px] leading-relaxed transition-all duration-200 opacity-0 pointer-events-none group-hover:opacity-100 z-10 ${
                  theme === "dark" ? "bg-slate-950 border border-slate-800 text-slate-300" : "bg-natural-surface border border-natural-border-darker text-natural-dark shadow-lg"
                }`}>
                  {pol.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
