"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

interface ScrapeSummary {
  review_count: number;
  average_rating: number;
  date_range: string;
  platform: string;
  sample_reviews: Array<{ rating: number; text: string; date: string }>;
}

interface LogEvent {
  timestamp: string;
  event: string;
  input?: any;
  output?: any;
}

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  timestamp: string;
  is_scope_compliant?: boolean;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ScrapeSummary | null>(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await axios.post(`${apiUrl}/api/session`);
        setSessionId(response.data.session_id);
        console.log("Session created:", response.data.session_id);
      } catch (err) {
        console.error("Failed to create session:", err);
      }
    };
    initSession();
  }, []);

  // Fetch logs for current session
  const fetchLogs = async () => {
    if (!sessionId) return;
    try {
      const response = await axios.get(`${apiUrl}/api/session/${sessionId}/logs`);
      setLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const handleScrape = async () => {
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("url", url);
      formData.append("session_id", sessionId);
      
      const response = await axios.post(`${apiUrl}/api/scrape`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSummary(response.data);
      // Clear chat messages when new data is loaded
      setChatMessages([]);
      setShowChat(false);
      // Refetch logs after scraping
      setTimeout(fetchLogs, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to scrape reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    
    const userMessage: ChatMessage = {
      role: "user",
      message: chatInput,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/chat`, {
        message: chatInput,
        session_id: sessionId,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        message: response.data.response,
        timestamp: new Date().toISOString(),
        is_scope_compliant: response.data.is_scope_compliant,
      };
      
      setChatMessages((prev) => [...prev, assistantMessage]);
      // Refetch logs
      setTimeout(fetchLogs, 500);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        message: "Error: " + (err.response?.data?.detail || "Failed to get response"),
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleReviewExpansion = (reviewIndex: number) => {
  setExpandedReviews(prev => {
    const newSet = new Set(prev);
    if (newSet.has(reviewIndex)) {
      newSet.delete(reviewIndex);
    } else {
      newSet.add(reviewIndex);
    }
    return newSet;
  });
};
  const handleCsvUpload = async () => {
    if (!csvFile || !sessionId) return;
    
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("session_id", sessionId);

      const response = await axios.post(`${apiUrl}/api/upload-reviews`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setSummary(response.data);
      setCsvFile(null);
      // Clear chat messages when new data is loaded
      setChatMessages([]);
      setShowChat(false);
      // Refetch logs after uploading
      setTimeout(fetchLogs, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🔍 ReviewLens AI
            </h1>
            <p className="text-gray-600 mt-1">
              Intelligent review analysis powered by AI
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Session ID</p>
            <p className="font-mono text-xs bg-gray-100 px-3 py-1 rounded">
              {sessionId ? sessionId.substring(0, 8) + "..." : "Loading..."}
            </p>
            <button
              onClick={() => {
                fetchLogs();
                setShowLogs(!showLogs);
              }}
              className="mt-2 px-3 py-1 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 text-sm font-medium"
            >
              📋 Logs ({logs.length})
            </button>
          </div>
        </div>
      </header>

      {/* Logs Panel */}
      {showLogs && (
        <div className="bg-gray-900 text-white p-6 max-h-96 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg font-bold mb-4">📋 AI Session Transcript</h2>
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No logs yet. Ingest or chat to create logs.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, idx) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-700 text-xs font-mono">
                    <div className="text-gray-400 mb-1">
                      {new Date(log.timestamp).toLocaleTimeString()} • {log.event}
                    </div>
                    <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify({ input: log.input, output: log.output }, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Ingestion Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📥 Ingest Reviews
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/ASIN..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={loading}
                />
                <button
                  onClick={handleScrape}
                  disabled={loading || !url}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? "Scraping..." : "Scrape"}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* CSV Upload Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Or Upload CSV</h3>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={loading}
                />
                <button
                  onClick={handleCsvUpload}
                  disabled={loading || !csvFile}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Scraping Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Review Count</p>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.review_count}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {summary.average_rating.toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Platform</p>
                <p className="text-xl font-bold text-green-600 capitalize">
                  {summary.platform}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Date Range</p>
                <p className="text-lg font-bold text-purple-600">
                  {summary.date_range}
                </p>
              </div>
            </div>

            {/* Sample Reviews */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sample Reviews
              </h3>
              <div className="space-y-4">
                {summary.sample_reviews.map((review, idx) => {
                  const hasSeeMore = review.text.toLowerCase().includes('see more');
                  const isExpanded = expandedReviews.has(idx);
                  const displayText = isExpanded
                    ? review.text.replace(/\s*See more\s*$/i, '').trim()
                    : review.text.replace(/\s*See more\s*$/i, '').trim().substring(0, 150) + (hasSeeMore ? '...' : '');

                  return (
                    <div
                      key={idx}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900 text-lg">
                          {"⭐".repeat(review.rating)}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">
                          {review.date}
                        </span>
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {displayText}
                        {hasSeeMore && !isExpanded && (
                          <button
                            onClick={() => toggleReviewExpansion(idx)}
                            className="text-blue-600 font-medium ml-1 hover:text-blue-800 hover:underline focus:outline-none"
                          >
                            [Read more...]
                          </button>
                        )}
                        {hasSeeMore && isExpanded && (
                          <button
                            onClick={() => toggleReviewExpansion(idx)}
                            className="text-blue-600 font-medium ml-1 hover:text-blue-800 hover:underline focus:outline-none"
                          >
                            [Show less]
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowChat(true)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                ✨ Start Q&A Analysis
              </button>
              <button className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                📥 Upload CSV Instead
              </button>
            </div>

            {/* Chat Interface */}
            {(showChat || chatMessages.length > 0) && (
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Q&A Chat</h3>
                <div className="bg-white rounded border border-gray-200 h-96 overflow-y-auto mb-4 p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">Ask a question about the reviews...</p>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-2xl px-4 py-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : msg.is_scope_compliant === false
                              ? "bg-red-100 text-red-900 border border-red-300"
                              : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-sm">{msg.message}</p>
                        ) : (
                          <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                h2: ({...props}: any) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900" {...props} />,
                                h3: ({...props}: any) => <h3 className="text-base font-semibold mt-3 mb-2 text-gray-800" {...props} />,
                                p: ({...props}: any) => <p className="mb-2 text-gray-700" {...props} />,
                                ul: ({...props}: any) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700" {...props} />,
                                li: ({...props}: any) => <li className="text-gray-700" {...props} />,
                                strong: ({...props}: any) => <strong className="font-semibold text-gray-900" {...props} />,
                                em: ({...props}: any) => <em className="italic text-gray-600" {...props} />,
                              }}
                            >
                              {msg.message}
                            </ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChat()}
                    placeholder="Ask about the reviews..."
                    disabled={chatLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {chatLoading ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Info Section */}
        {!summary && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ℹ️ How It Works
            </h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  Enter a URL from Amazon, Google Maps, G2, or Capterra
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <span>ReviewLens scrapes and summarizes the reviews</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <span>Chat with AI to analyze trends and patterns</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">4.</span>
                <span>AI guards against out-of-scope questions</span>
              </li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}
