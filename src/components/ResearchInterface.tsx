import { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Sparkles, TrendingUp, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import StructuredVisualizer from './StructuredVisualizer';

export default function ResearchInterface() {
  const [messages, setMessages] = useState<{
    role: 'user' | 'assistant',
    content: string,
    structuredData?: any
  }[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Agent Selection State (Keeping UI for aesthetic, but logic is disabled)
  const [isAutoSelect, setIsAutoSelect] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['web', 'iqvia', 'clinical', 'patent', 'exim', 'internal']);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSubmitting]);

  // Click Outside to close Agent Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(event.target as Node)) {
        setShowAgentMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAgent = (agent: string) => {
    setSelectedAgents(prev =>
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
  };

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isSubmitting) return;

    setInput('');
    setIsSubmitting(true);

    setMessages(prev => [...prev, { role: 'user', content: query }]);

    const performRequest = async (attempt: number = 1): Promise<any> => {
      try {
        const url = new URL("/webhook/fodse2", window.location.origin);
        url.searchParams.append("message", query);
        url.searchParams.append("_t", Date.now().toString()); // Cache busting

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);

        console.log(`🌐 Fetching: ${url.toString()}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            response: {
              status: response.status,
              data: errorData
            },
            message: `HTTP Error ${response.status}`,
            code: response.status.toString()
          };
        }

        const data = await response.json();
        return { status: response.status, data };
      } catch (err: any) {
        const isNetworkError = err.name === 'AbortError' || err.message?.includes('NETWORK_CHANGED') || err.code === 'ERR_NETWORK';

        if (isNetworkError && attempt < 3 && err.name !== 'AbortError') {
          console.warn(`Interruption detected (Attempt ${attempt}). Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return performRequest(attempt + 1);
        }
        throw err;
      }
    };

    try {
      console.log("🚀 Sending GET request to n8n Production Webhook (Timeout: 5m)...");
      const response = await performRequest();

      console.log("✅ Success!", response.status, response.data);

      const data = response.data;
      let botContent = "";
      let structuredData = null;

      let rawContent = "";
      if (Array.isArray(data) && data.length > 0) {
        rawContent = data[0].output || data[0].response || data[0].message || JSON.stringify(data[0]);
      } else {
        rawContent = data.output || data.response || data.message || JSON.stringify(data);
      }

      // Try to parse structured JSON from the output
      try {
        const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        if (parsed && typeof parsed === 'object' && (parsed.market_growth !== undefined || parsed.answer !== undefined)) {
          botContent = parsed.answer || parsed.message || "Here is the structured analysis for your research:";
          structuredData = parsed;
        } else {
          botContent = rawContent;
        }
      } catch (e) {
        botContent = rawContent;
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: botContent, structuredData }
      ]);

    } catch (err: any) {
      console.group("🆘 WEBHOOK DEBUG DATA");
      const isAxiosErr = axios.isAxiosError(err);
      const status = isAxiosErr ? err.response?.status : err.response?.status;
      const code = isAxiosErr ? err.code : (err.name === 'AbortError' ? 'TIMEOUT' : err.code);
      const message = err.message;

      console.error("Status:", status);
      console.error("Code:", code);
      console.error("Message:", message);
      if (err.response?.data) console.error("Server Response:", err.response.data);
      console.groupEnd();

      let userFriendlyMessage = `Connection Error: ${message}`;

      if (message.includes('NETWORK_CHANGED') || code === 'ERR_NETWORK') {
        userFriendlyMessage = "Your browser detected a network change. Please check your internet stability.";
      } else if (status === 404) {
        userFriendlyMessage = "The webhook returned a 404. Ensure your n8n workflow is 'Active'.";
      } else if (code === 'TIMEOUT' || code === 'ECONNABORTED' || message.includes('timeout')) {
        userFriendlyMessage = "The research agent is taking longer than expected (over 5 minutes). This usually happens during intensive market research. Please try a more specific query.";
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `I'm having trouble connecting to the knowledge stream. ${userFriendlyMessage}` }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Content / Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-10 pb-2">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-start pt-12 text-center space-y-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 ring-4 ring-white/20 backdrop-blur-sm">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white tracking-tight drop-shadow-sm">
                  PharmaAI Research Agent
                </h1>
                <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-lg font-medium">
                  Deep-dive market analysis, patent landscapes, and clinical trial intelligence in seconds.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
                <button onClick={() => setInput("Analyze global market for GLP-1 agonists")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-blue-100/80 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Market Analysis</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">"Analyze global market for GLP-1 agonists"</p>
                </button>

                <button onClick={() => setInput("Find new indications for Metformin")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-purple-100/80 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Repurposing</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">"Find new indications for Metformin"</p>
                </button>

                <button onClick={() => setInput("Overview of CRISPR delivery patents")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-amber-100/80 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Patent Search</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">"Overview of CRISPR delivery patents"</p>
                </button>

                <button onClick={() => setInput("List ongoing Phase 3 Alzheimer's trials")} className="group p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-400 hover:bg-white/80 dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2.5 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Bot className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Clinical Intel</span>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">"List ongoing Phase 3 Alzheimer's trials"</p>
                </button>
              </div>
            </div>
          )}

          {/* Messages Section */}
          <div className="space-y-8">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} px-4 animate-in slide-in-from-bottom-5 fade-in duration-500`}>
                <div className={`flex space-x-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''} group`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 ${msg.role === 'user' ? 'bg-slate-800/50' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-indigo-300" /> : <Bot className="w-6 h-6 text-white" />}
                  </div>
                  <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai group border-indigo-500/20 bg-indigo-500/5'}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest text-glow">PharmaAI Assistant</span>
                      </div>
                    )}
                    <div className={`prose prose-lg dark:prose-invert max-w-none leading-relaxed text-xl ${msg.role === 'user' ? 'prose-p:text-white' : 'prose-p:text-slate-300 prose-headings:text-slate-100 font-medium'}`}>
                      <ReactMarkdown
                        components={{
                          strong: ({ node, ...props }: any) => <strong className="font-semibold text-indigo-300" {...props} />,
                          a: ({ node, ...props }: any) => <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.structuredData && (
                      <StructuredVisualizer data={msg.structuredData} />
                    )}

                    {msg.role === 'user' && <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-white/10 blur-2xl rounded-full -z-10 group-hover:bg-white/20 transition-all" />}
                  </div>
                </div>
              </div>
            ))}

            {isSubmitting && (
              <div className="flex justify-start px-4 animate-in slide-in-from-bottom-5 fade-in duration-700">
                <div className="flex space-x-4 w-full max-w-full">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-2 shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-1 ring-white/30">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-4 max-w-[95%] min-w-0">
                    <div className="chat-ai group border-indigo-500/20 bg-indigo-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-glow">PharmaAI Assistant</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                      <div className="py-2">
                        <span className="text-sm font-medium text-indigo-300/70 animate-pulse font-mono">
                          CONNECTING_TO_KNOWLEDGE_STREAM...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Bar (Fixed Bottom) */}
      <div className="p-4 bg-gradient-to-t from-[#020617] via-[#020617]/90 to-transparent z-20">
        <div className="max-w-5xl mx-auto relative px-4 md:px-0">

          {/* Agent Menu Popover */}
          {showAgentMenu && (
            <div ref={agentMenuRef} className="absolute bottom-20 left-4 right-4 md:left-0 md:right-auto bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] p-4 w-auto md:w-72 z-50 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-white/5">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Active Research Agents</span>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/50">PRO</span>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                <label className="flex items-center space-x-3 cursor-pointer group p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isAutoSelect ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'border border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                    {isAutoSelect && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" className="hidden" checked={isAutoSelect} onChange={() => setIsAutoSelect(!isAutoSelect)} />
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">Auto-Pilot</span>
                  </div>
                </label>
                {!isAutoSelect && (
                  <div className="space-y-1 mt-2 ml-1">
                    {[{ id: 'web', label: 'Web Search', icon: '🌐' }, { id: 'iqvia', label: 'Market Data', icon: '📊' }, { id: 'clinical', label: 'Clinical Trials', icon: '🏥' }, { id: 'patent', label: 'Patent DB', icon: '📜' }].map(agent => (
                      <label key={agent.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-transparent text-indigo-500 focus:ring-offset-0" checked={selectedAgents.includes(agent.id)} onChange={() => toggleAgent(agent.id)} />
                        <span className="text-sm text-slate-600 dark:text-slate-300">{agent.icon} {agent.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="chat-input group focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:ring-indigo-500/20">
            <button
              type="button"
              onClick={() => setShowAgentMenu(!showAgentMenu)}
              className={`p-2 rounded-xl transition-all active:scale-95 ${showAgentMenu ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              title="Select Data Sources"
            >
              <Sparkles className={`w-5 h-5 ${isAutoSelect ? 'text-cyan-500 dark:text-cyan-400 filter drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a molecule, disease, or repurposing idea..."
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xl font-medium px-2"
            />

            <button
              type="submit"
              disabled={!input.trim() || isSubmitting}
              className="btn-send relative overflow-hidden group/send"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-300" />
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
          <div className="text-center mt-3 h-6 flex justify-center items-center gap-2">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
              {isAutoSelect ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Auto-Pilot Active
                </>
              ) : (
                <>
                  <span>Active Agents:</span>
                  <span className="text-slate-500 dark:text-slate-400">{selectedAgents.length}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
