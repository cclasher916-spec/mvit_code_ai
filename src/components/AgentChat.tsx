import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/apiConfig';

type TraceStep = { step: string; text: string };
type Message = { role: 'user' | 'agent'; text: string; trace?: TraceStep[]; isMultiGoal?: boolean; mode?: string };

const STEP_COLORS: Record<string, string> = {
  GOAL:   'text-blue-400',
  PLAN:   'text-purple-400',
  ACTION: 'text-yellow-400',
  RESULT: 'text-green-300',
  REVIEW: 'text-emerald-400',
  ERROR:  'text-red-400',
};

const STEP_ICONS: Record<string, string> = {
  GOAL:   '🎯',
  PLAN:   '🧠',
  ACTION: '⚙️',
  RESULT: '📊',
  REVIEW: '✅',
  ERROR:  '❌',
};

const TracePanel = ({ trace, autoOpen }: { trace: TraceStep[]; autoOpen?: boolean }) => {
  const [open, setOpen] = useState(autoOpen || false);
  if (!trace || trace.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-gray-700 bg-gray-900 overflow-hidden text-xs font-mono">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Cpu size={12} className="text-indigo-400" />
          <span className="text-indigo-300 font-semibold">Agent Reasoning Trace</span>
          <span className="text-gray-500">({trace.length} steps)</span>
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700"
          >
            <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {trace.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-2 items-start"
                >
                  <span className={`shrink-0 font-bold w-14 ${STEP_COLORS[t.step] || 'text-gray-400'}`}>
                    {STEP_ICONS[t.step] || '•'} {t.step}
                  </span>
                  <span className="text-gray-300 break-all leading-tight">{t.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AgentChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', text: 'Hi! I am the Autonomous Campus AI Agent. Ask me about circulars, schedules, or coding doubts!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/- /g, '• ');

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
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
        trace: data.trace || [],
        isMultiGoal: data.is_multi_goal || false,
        mode: data.mode || 'llm_agent'
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: "Error connecting to the autonomous agent backend. Ensure FastAPI is running on port 8000." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-[100] flex items-center justify-center hover:scale-105 duration-200"
      >
        <MessageCircle size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[380px] md:w-[440px] bg-gray-950 rounded-2xl shadow-2xl z-[100] overflow-hidden border border-gray-700 flex flex-col h-[560px]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot size={22} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-indigo-700 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none">Autonomous Campus Agent</h3>
                  <p className="text-indigo-200 text-xs">Goal → Plan → Act → Verify</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-indigo-100 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm ml-auto'
                        : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
                    }`}>
                      {msg.role === 'agent'
                        ? <span dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                        : msg.text}
                      {msg.role === 'agent' && msg.isMultiGoal && (
                        <div className="mt-2">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-900 text-purple-300 border border-purple-700 font-semibold">⚡ Multi-Goal Orchestrator</span>
                        </div>
                      )}
                      {msg.role === 'agent' && !msg.isMultiGoal && msg.mode === 'orchestrator' && (
                        <div className="mt-2">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700 font-semibold">🤖 Autonomous Flow</span>
                        </div>
                      )}
                    </div>
                    {msg.role === 'agent' && msg.trace && msg.trace.length > 0 && (
                      <TracePanel trace={msg.trace} autoOpen={msg.isMultiGoal} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150" />
                    <span className="ml-2 text-xs text-indigo-400">Agent thinking...</span>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-gray-900 border-t border-gray-700 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about students, top performers, circulars..."
                className="flex-1 bg-gray-800 text-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgentChat;
