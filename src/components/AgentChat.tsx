import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Minus, Maximize2, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../lib/apiConfig';

type Message = { 
  role: 'user' | 'agent'; 
  text: string; 
  suggestions?: string[];
  mode?: string;
  timestamp: Date;
};

const AgentChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'agent', 
      text: '### 👋 Hi there! I am your **Autonomous Campus AI Agent**.\n\nI can help you analyze **student performance**, identify **inactive members**, or generate **team leaderboards**. What would you like to know today?',
      suggestions: ['Who is the top performer?', 'Show me inactive members', 'Team leaderboard'],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input.trim();
    if (!userMsg) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: sessionId.current })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        role: 'agent',
        text: data.reply || "Sorry, I couldn't process that.",
        suggestions: data.suggestions || [],
        mode: data.mode || 'llm_agent',
        timestamp: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: "🚨 **Error connecting to backend.** Please ensure the agent service is live.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'agent', 
      text: 'Chat cleared. How can I help you now?', 
      timestamp: new Date() 
    }]);
    sessionId.current = `session_${Date.now()}`;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-500 transition-all z-[100] flex items-center justify-center hover:scale-110 active:scale-95 duration-200 ${isOpen && !isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={28} className="drop-shadow-lg" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Draggable handle=".chat-header" bounds="body" defaultPosition={{x: 0, y: 0}} cancel="button">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
              animate={isMinimized ? { 
                opacity: 1, y: 0, scale: 1, x: 0,
                height: '64px', width: '280px'
              } : { 
                opacity: 1, y: 0, scale: 1, x: 0,
                height: 'min(700px, calc(100% - 48px))', 
                width: 'min(480px, calc(100vw - 32px))'
              }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className={`fixed z-[110] bg-gray-950/90 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col overflow-hidden 
                md:max-h-[700px] md:max-w-[480px] bottom-6 right-6
                ${isMinimized ? 'rounded-[32px]' : 'rounded-3xl'}`}
            >
              {/* Header */}
              <div className={`chat-header cursor-move flex justify-between items-center px-5 flex-shrink-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/5 h-16`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white tracking-tight">Campus AI Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Live & Autonomous</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized ? (
                  <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Minimize">
                    <Minus size={18} />
                  </button>
                ) : (
                  <button onClick={() => setIsMinimized(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Expand">
                    <Maximize2 size={18} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all" title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] relative ${msg.role === 'user' ? 'order-1' : 'order-1'}`}>
                        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none border border-white/10'
                            : 'bg-white/5 text-gray-200 rounded-tl-none border border-white/5'
                        }`}>
                          <div className={`prose prose-invert prose-sm max-w-none 
                            ${msg.role === 'agent' ? 'prose-p:mt-0 prose-p:mb-2 prose-headings:mt-0 prose-headings:mb-2 prose-hr:my-4 prose-hr:border-white/10 prose-strong:text-indigo-300' : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Prompt Suggestions */}
                        {msg.role === 'agent' && msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !isLoading && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {msg.suggestions.map((suggestion, i) => (
                              <button
                                key={i}
                                onClick={() => handleSend(suggestion)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all flex items-center gap-1.5 group"
                              >
                                {suggestion}
                                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                      <div className="bg-white/5 border border-white/5 text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex gap-2 items-center">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        </div>
                        <span className="text-xs font-medium text-indigo-400/80 ml-1">Agent is analyzing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={endOfMessagesRef} />
                </div>

                {/* Footer / Input */}
                <div className="p-4 bg-gray-900/50 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={clearChat}
                      className="p-2.5 text-gray-500 hover:text-red-400 transition-colors bg-white/5 rounded-2xl"
                      title="Clear Chat"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="flex-1 relative">
                       <textarea
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full bg-white/5 text-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/5 placeholder:text-gray-600 resize-none max-h-32 transition-all"
                      />
                      <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:hover:scale-100 hover:scale-110 active:scale-95 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-gray-600 font-medium">
                    Autonomous Agent v2.1 • Built for MVIT Coding Team
                  </p>
                </div>
              </>
            )}
            </motion.div>
          </Draggable>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgentChat;

