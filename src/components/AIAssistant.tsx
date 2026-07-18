import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Minus,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Square,
  User,
  Bot,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

interface AIAssistantProps {
  currentAQI: number;
  currentWeatherSummary: string;
  onSelectAction: (actionKey: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "What is PM2.5 and PM10?",
  "How does wind speed affect AQI?",
  "Is it safe to go outside today?",
  "Give me 3 tips to reduce my carbon footprint",
  "Explain air pollution health effects",
];

export default function AIAssistant({
  currentAQI,
  currentWeatherSummary,
  onSelectAction,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! I am **AirGuard AI**, your personal environmental assistant. Ask me anything about the Air Quality Index (AQI), PM2.5, carbon footprints, safe outdoor activities, or how weather affects air pollution!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assistantTheme, setAssistantTheme] = useState<"dark" | "light">("dark");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<any>(null);

  // Auto-scroll on new messages or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText, isOpen, isMinimized]);

  // Sync TTS status and cancel if disabled
  useEffect(() => {
    if (!isTTSActive) {
      stopSpeaking();
    }
  }, [isTTSActive]);

  // Speech Recognition (STT) setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsSTTActive(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? prev + " " + text : text));
        handleVoiceCommand(text);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsSTTActive(false);
      };

      rec.onend = () => {
        setIsSTTActive(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  // Vocalize assistant messages if TTS is active
  const vocalize = (text: string) => {
    if (!isTTSActive || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    // Strip markdown characters before speaking
    const cleanText = text
      .replace(/[*#_`\-]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Use a premium-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice =
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Aria"))
      ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
      }
    } else {
      alert("Speech Recognition (Microphone input) is not supported in this browser. Try Chrome or Safari.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Check voice commands
  const handleVoiceCommand = (spokenText: string) => {
    const text = spokenText.toLowerCase().trim();
    if (text === "help") {
      sendMessage("Show me the help options.");
    } else if (text === "clear" || text === "clear chat") {
      clearChat();
    } else if (text === "close" || text === "minimize" || text === "close chat") {
      setIsMinimized(true);
    } else if (text === "explain aqi" || text === "what is aqi") {
      sendMessage("Explain today's AQI level.");
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isStreaming) return;

    if (!textToSend) {
      setInputMessage("");
    }

    // Stop speaking currently reading voice
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamedText("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AirGuard AI server");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullAssistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullAssistantText += parsed.text;
                setStreamedText(fullAssistantText);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (err) {
              console.warn("JSON parse warning inside SSE stream:", err);
            }
          }
        }
      }

      // Add final message
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: fullAssistantText || "I received your message, but was unable to formulate a response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMsg]);
      vocalize(modelMsg.text);
    } catch (err: any) {
      console.error("Failed to stream AI Chat:", err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: `⚠️ **Error:** ${err.message || "Something went wrong. Please check your network or try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
      setStreamedText("");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    stopSpeaking();
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: `Chat cleared. Today's current Air Quality index is **${currentAQI}** with meteorological status: **${currentWeatherSummary}**. How can I assist you with AirGuard AI's metrics or predictions?`,
        timestamp: new Date(),
      },
    ]);
  };

  const formatMarkdown = (text: string) => {
    // Basic formatting helper for simple bold/lists/code blocks
    let formatted = text;
    const isDark = assistantTheme === "dark";
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, isDark ? '<strong class="font-bold text-sky-400">$1</strong>' : '<strong class="font-bold text-natural-accent">$1</strong>');
    // Code blocks
    formatted = formatted.replace(/`(.*?)`/g, isDark ? '<code class="bg-slate-800 text-pink-400 px-1 py-0.5 rounded text-xs font-mono">$1</code>' : '<code class="bg-natural-surface-light border border-natural-border-darker text-pink-700 px-1 py-0.5 rounded text-[11px] font-mono font-bold">$1</code>');
    // Newlines
    formatted = formatted.replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="ai-assistant-fab"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-natural-accent to-natural-accent-hover hover:opacity-95 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer border border-natural-accent-hover/25"
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
              Live
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Assistant Windows */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-assistant-window"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : "600px",
              width: "380px",
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 rounded-3xl shadow-3xl overflow-hidden flex flex-col border ${
              assistantTheme === "dark"
                ? "bg-slate-950/85 backdrop-blur-xl border-slate-800 text-white"
                : "bg-white border-natural-border text-natural-text shadow-2xl"
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${
              assistantTheme === "dark" ? "border-slate-800 bg-slate-900/50" : "border-natural-border-darker bg-natural-surface-light"
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-natural-accent to-natural-accent-hover flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${assistantTheme === "dark" ? "text-white" : "text-natural-dark"}`}>
                    AirGuard AI Assistant
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  </h3>
                  <p className={`text-[10px] ${assistantTheme === "dark" ? "opacity-75" : "text-natural-slate font-medium"}`}>Environmental Meteorologist</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <button
                  onClick={() => setAssistantTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className={`p-1.5 rounded-lg cursor-pointer ${assistantTheme === "dark" ? "hover:bg-slate-700/20 text-slate-300" : "hover:bg-natural-surface text-natural-text"}`}
                  title="Toggle Local Theme"
                >
                  {assistantTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {/* Speech synthesizer toggle */}
                <button
                  onClick={() => setIsTTSActive(!isTTSActive)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isTTSActive 
                      ? assistantTheme === "dark" ? "text-sky-400 hover:bg-slate-700/20" : "text-natural-accent hover:bg-natural-surface font-bold" 
                      : "opacity-50 hover:bg-slate-700/20"
                  }`}
                  title={isTTSActive ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                >
                  {isTTSActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Minimize window */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={`p-1.5 rounded-lg cursor-pointer ${assistantTheme === "dark" ? "hover:bg-slate-700/20 text-slate-300" : "hover:bg-natural-surface text-natural-text"}`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Close assistant */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className={`p-1.5 rounded-lg cursor-pointer ${assistantTheme === "dark" ? "hover:bg-red-500/20 text-red-400" : "hover:bg-rose-50 text-rose-600"}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body & Input Container */}
            {!isMinimized && (
              <>
                {/* Messages List */}
                <div className={`flex-1 p-4 overflow-y-auto space-y-4 max-h-[440px] ${assistantTheme === "dark" ? "" : "bg-[#fdfcf9]"}`}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role !== "user" && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          assistantTheme === "dark" ? "bg-slate-800 border-slate-700" : "bg-natural-surface border-natural-border-darker"
                        }`}>
                          <Bot className={`w-3.5 h-3.5 ${assistantTheme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
                        </div>
                      )}

                      <div className="group relative max-w-[80%] flex flex-col gap-1">
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.role === "user"
                              ? assistantTheme === "dark"
                                ? "bg-sky-500 text-white rounded-br-none"
                                : "bg-natural-accent text-white rounded-br-none font-medium shadow-sm"
                              : assistantTheme === "dark"
                              ? "bg-slate-900 border border-slate-800 rounded-bl-none text-slate-100"
                              : "bg-white border border-natural-border rounded-bl-none text-natural-dark font-medium shadow-xs"
                          }`}
                        >
                          {formatMarkdown(msg.text)}
                        </div>

                        {/* Speech active sound wave indicator */}
                        {msg.role === "model" && isSpeaking && messages[messages.length - 1]?.id === msg.id && (
                          <div className="flex items-center gap-1.5 px-2 mt-1">
                            <span className={`text-[10px] animate-pulse ${assistantTheme === "dark" ? "text-sky-400" : "text-natural-accent"}`}>Reading aloud...</span>
                            <div className="flex gap-0.5 items-end h-3">
                              <span className={`w-0.5 h-2.5 animate-[pulse_0.5s_infinite_alternate] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                              <span className={`w-0.5 h-1 animate-[pulse_0.3s_infinite_alternate_0.1s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                              <span className={`w-0.5 h-3 animate-[pulse_0.4s_infinite_alternate_0.2s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                              <span className={`w-0.5 h-1.5 animate-[pulse_0.5s_infinite_alternate_0.1s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                            </div>
                            <button
                              onClick={stopSpeaking}
                              className="ml-2 text-[10px] text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              <Square className="w-2 h-2 fill-current" /> Stop
                            </button>
                          </div>
                        )}

                        <span className="text-[9px] opacity-50 px-1 self-end font-semibold">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {/* Copy / Action Buttons hover states */}
                        <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 px-2 right-full">
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className={`p-1 rounded-lg border shadow-xs ${
                              assistantTheme === "dark"
                                ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                : "bg-white border-natural-border text-natural-text hover:text-natural-dark"
                            } cursor-pointer`}
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {msg.role === "user" && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          assistantTheme === "dark" ? "bg-sky-500/20 border-sky-500/30 text-sky-400" : "bg-natural-accent/15 border-natural-accent/30 text-natural-accent"
                        }`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming Assistant Response */}
                  {isStreaming && streamedText && (
                    <div className="flex gap-2.5 justify-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        assistantTheme === "dark" ? "bg-slate-800 border-slate-700 animate-pulse" : "bg-natural-surface border-natural-border-darker"
                      }`}>
                        <Bot className={`w-3.5 h-3.5 ${assistantTheme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
                      </div>
                      <div className="max-w-[80%] flex flex-col gap-1">
                        <div
                          className={`p-3 rounded-2xl rounded-bl-none text-xs leading-relaxed ${
                            assistantTheme === "dark"
                              ? "bg-slate-900 border border-slate-800 text-slate-100"
                              : "bg-white border border-natural-border text-natural-dark font-medium shadow-xs"
                          }`}
                        >
                          {formatMarkdown(streamedText)}
                          <span className={`inline-block w-1.5 h-3.5 ml-1 animate-pulse ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typing Loader */}
                  {isStreaming && !streamedText && (
                    <div className="flex gap-2.5 justify-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        assistantTheme === "dark" ? "bg-slate-800 border-slate-700 animate-bounce" : "bg-natural-surface border-natural-border animate-bounce"
                      }`}>
                        <Bot className={`w-3.5 h-3.5 ${assistantTheme === "dark" ? "text-sky-400" : "text-natural-accent"}`} />
                      </div>
                      <div className={`p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 max-w-[80%] border ${
                        assistantTheme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-natural-border"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions & Suggested Questions */}
                {messages.length <= 2 && (
                  <div className={`px-4 pb-3 ${assistantTheme === "dark" ? "" : "bg-[#fdfcf9]"}`}>
                    <p className={`text-[10px] mb-1.5 flex items-center gap-1 font-bold ${assistantTheme === "dark" ? "opacity-60 text-sky-400" : "text-natural-accent"}`}>
                      <Sparkles className="w-3 h-3" /> Suggested questions:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className={`text-[10px] py-1 px-2.5 rounded-full border text-left cursor-pointer transition shadow-xs ${
                            assistantTheme === "dark"
                              ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-300"
                              : "border-natural-border bg-white hover:bg-natural-surface hover:border-natural-border-darker text-natural-text font-medium"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Input Bar */}
                <div className={`p-3 border-t ${
                  assistantTheme === "dark" ? "border-slate-800 bg-slate-950" : "border-natural-border-darker bg-natural-surface-light"
                } flex flex-col gap-2`}>
                  <div className="flex items-center gap-2">
                    {/* Clear Button */}
                    <button
                      onClick={clearChat}
                      className={`p-2 rounded-xl transition cursor-pointer border shadow-xs ${
                        assistantTheme === "dark"
                          ? "bg-slate-900 hover:bg-red-500/20 border-slate-800 text-slate-400 hover:text-red-400"
                          : "bg-white hover:bg-rose-50 border-natural-border text-natural-text hover:text-rose-700 hover:border-rose-300"
                      }`}
                      title="Clear session chat history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Chat Text Input */}
                    <div className="flex-1 relative flex items-center">
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder={
                          isSTTActive ? "Listening to your voice..." : "Ask AirGuard AI..."
                        }
                        disabled={isStreaming || isSTTActive}
                        className={`w-full py-2 pl-3 pr-10 text-xs rounded-xl focus:outline-none focus:ring-1 focus:border-transparent ${
                          assistantTheme === "dark"
                            ? "bg-slate-900 border border-slate-800 text-white focus:ring-sky-500 placeholder-slate-500"
                            : "bg-white border border-natural-border text-natural-dark focus:ring-natural-accent placeholder-natural-slate font-medium shadow-xs"
                        }`}
                      />

                      {/* Microphone button inside text bar */}
                      <button
                        onClick={isSTTActive ? stopListening : startListening}
                        className={`absolute right-1.5 p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                          isSTTActive
                            ? "bg-red-500/20 text-red-400 animate-ping"
                            : assistantTheme === "dark"
                            ? "text-slate-400 hover:text-white"
                            : "text-natural-slate hover:text-natural-accent"
                        }`}
                        title={isSTTActive ? "Stop microphone" : "Speak to assistant"}
                      >
                        {isSTTActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => sendMessage()}
                      disabled={isStreaming || !inputMessage.trim()}
                      className={`p-2 text-white rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer transition ${
                        assistantTheme === "dark" 
                          ? "bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500"
                          : "bg-gradient-to-tr from-natural-accent to-natural-accent-hover"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Audio visualization wave if STT is active */}
                  {isSTTActive && (
                    <div className={`flex items-center gap-2 justify-center py-1 border rounded-lg text-[10px] ${
                      assistantTheme === "dark" 
                        ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                        : "bg-natural-surface border-natural-border text-natural-accent"
                    }`}>
                      <div className="flex gap-0.5 items-end h-3">
                        <span className={`w-0.5 h-1 animate-[pulse_0.3s_infinite_alternate] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        <span className={`w-0.5 h-3 animate-[pulse_0.4s_infinite_alternate_0.1s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        <span className={`w-0.5 h-1.5 animate-[pulse_0.3s_infinite_alternate_0.2s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                        <span className={`w-0.5 h-2.5 animate-[pulse_0.5s_infinite_alternate_0.1s] ${assistantTheme === "dark" ? "bg-sky-400" : "bg-natural-accent"}`}></span>
                      </div>
                      <span className="font-bold">Speak now... "Help" / "Clear chat"</span>
                      <button
                        onClick={stopListening}
                        className="text-rose-600 font-bold hover:underline ml-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
