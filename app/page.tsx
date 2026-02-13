"use client";

import { useState, useRef, useEffect } from "react";

interface LiveDigestChunk {
  explanation?: string;
  event?: string;
  timestamp?: string;
  analysis?: string;
  frame_count?: number;
  summary?: string;
  [key: string]: any;
}

export default function Home() {
  const [streamUrl, setStreamUrl] = useState(
    "https://www.youtube.com/live/2q0JpKkhIYk",
  );
  const [apiKey, setApiKey] = useState("");
  const condition =
    "Analyze this sports match and predict win probabilities. 1) Identify teams by their jersey colors/uniforms. 2) Observe the current score and player performance (momentum, energy level, skill display). 3) Predict which team has a higher probability of winning. Unless there is absolutely no game footage in the stream, provide your probability prediction - use your best judgment and reasoning to estimate win rates even with limited information. Be specific about which team (identified by color) you predict will win.";
  const includeFrame = true;
  const [loading, setLoading] = useState(false);
  const [apiOutput, setApiOutput] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch)
      return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}`;

    // Handle youtube.com/live/VIDEO_ID
    const liveVideoMatch = url.match(/youtube\.com\/live\/([^\/?]+)/);
    if (liveVideoMatch)
      return `https://www.youtube-nocookie.com/embed/${liveVideoMatch[1]}`;

    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch)
      return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}`;

    // Handle youtube.com/@channel/live - try using @handle format
    const channelMatch = url.match(/youtube\.com\/@([^\/]+)\/?/);
    if (channelMatch) {
      return `https://www.youtube-nocookie.com/embed/live_stream?channel=@${channelMatch[1]}`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(streamUrl);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Real API call
  const startRealApiMonitoring = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_TRIO_BASE_URL || "";
    if (!baseUrl) {
      setApiOutput("Error: NEXT_PUBLIC_TRIO_BASE_URL not configured");
      setLoading(false);
      return;
    }

    const url = `${baseUrl}/api/check-once`;
    abortControllerRef.current = new AbortController();

    setApiOutput("Connecting to API...\n");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          condition,
          stream_url: streamUrl,
          include_frame: includeFrame,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiOutput(
          `API Error: ${response.status}\n${JSON.stringify(errorData, null, 2)}`,
        );
        setLoading(false);
        return;
      }

      setApiOutput((prev) => prev + "Connected! Receiving response...\n\n");

      // Parse JSON response
      const data: LiveDigestChunk = await response.json();
      setLoading(false);

      // Update output display - show explanation field only
      if (data.explanation) {
        setApiOutput(data.explanation);
      } else {
        setApiOutput(JSON.stringify(data, null, 2));
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setApiOutput((prev) => prev + "\nConnection stopped.");
      } else {
        setApiOutput((prev) => prev + `\nError: ${error.message}`);
      }
    }
  };

  const startMonitoring = async () => {
    if (!streamUrl || !apiKey) {
      alert("Please enter Stream URL and API Key");
      return;
    }

    setLoading(true);
    setApiOutput("");

    await startRealApiMonitoring();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Odds Hime</h1>
          <p className="text-cyan-400 text-sm">
            AI Watch Live Match · Real-time Prediction Analysis
          </p>
        </header>

        {/* Input Section */}
        <div className="bg-slate-900/60 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-cyan-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-cyan-400 text-sm mb-2">
                Stream URL *
              </label>
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-cyan-400 text-sm mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="your-api-key"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Video Preview */}
          {embedUrl && (
            <div className="mb-4">
              <label className="block text-cyan-400 text-sm mb-2">
                Live Stream Preview
              </label>
              <div className="relative w-full pt-[56.25%] bg-slate-800/50 rounded-lg overflow-hidden border border-slate-600">
                <iframe
                  src={embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <button
              onClick={startMonitoring}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-cyan-500/20"
            >
              {loading ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>
        </div>

        {/* API Output */}
        {apiOutput && (
          <div className="mt-6 bg-slate-900/60 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-cyan-400">◉</span>
              <span>API Output</span>
            </h2>
            <pre className="text-cyan-400 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
              {apiOutput}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
