import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, Bot, Activity, Terminal as TermIcon, BrainCircuit, Users, Zap, Clock, ChevronDown, ChevronUp, FileCode2 } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';
import { API_BASE_URL } from '../lib/apiConfig';

type ProactiveAction = {
  timestamp: string;
  trigger: string;
  flows_run: string[];
  summary: string;
  trace: {step: string; text: string}[];
};

type AgentTask = {
  id: string;
  member_name: string;
  description: string;
  difficulty: string;
  status: string; // 'assigned', 'pending', 'completed', 'failed'
  assigned_at: string;
  updated_at?: string;
  verification_log?: string;
};



const AgentAdmin = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoopTriggered, setIsLoopTriggered] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [proactiveActions, setProactiveActions] = useState<ProactiveAction[]>([]);
  const [allTasks, setAllTasks] = useState<AgentTask[]>([]);
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const { addToast } = useToast();
  const logEndRef = useRef<HTMLDivElement>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Poll for loop logs
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoopTriggered) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/logs`);
          if (res.ok) {
            const data = await res.json();
            setLogs(prev => {
              const next = data.logs || [];
              if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
              return next;
            });
            if (data.logs && data.logs.length > 0 && data.logs[data.logs.length-1].includes("Loop execution complete")) {
               setIsLoopTriggered(false);
            }
          }
        } catch (e) { console.error("Failed to fetch logs"); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoopTriggered]);

  // Poll proactive status every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/proactive-status`);
        if (res.ok) {
          const data = await res.json();
          setProactiveActions(prev => {
            const next = data.proactive_actions || [];
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            return next;
          });
        }
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll all agent tasks every 5s
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/all_tasks`);
        if (res.ok) {
          const data = await res.json();
          setAllTasks(prev => {
            const next = data.tasks || [];
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
            return next;
          });
        }
      } catch { /* silent */ }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      // Only auto-scroll if we are currently reasonably close to the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [logs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      addToast({ title: 'Please select a PDF file — campus circular or notice.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        addToast({ title: data.message || 'File ingested by the AI agent knowledge base.', type: 'success' });
        setFile(null);
      } else {
        addToast({ title: data.detail || 'Failed to ingest file.', type: 'error' });
      }
    } catch (err) {
      addToast({ title: 'Backend connection error. Ensure FastAPI is running.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with gradient glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-gray-900 to-indigo-950 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <Bot className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="text-indigo-400 h-10 w-10 animate-pulse" />
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-lg">
                Autonomous AI Core
              </h1>
            </div>
            <p className="text-indigo-200/80 max-w-lg text-lg">
              Live deterministic verification, logistic ELO orchestration, and proactive micro-interventions globally across the campus network.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE_URL}/trigger_loop`, { method: 'POST' });
                if (res.ok) {
                    addToast({ title: 'Initiating Global Intervention Loop...', type: 'success' });
                    setIsLoopTriggered(true);
                    setLogs(["[SYSTEM] Firing Trigger Engine... establishing secure connection to Firebase."]);
                }
              } catch (e) {
                addToast({ title: 'Agent Core Offline. Code 500.', type: 'error' });
              }
            }}
            disabled={isLoopTriggered}
            className={`px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-all duration-300 flex items-center gap-3 
              ${isLoopTriggered 
                  ? 'bg-gray-700 cursor-not-allowed border border-gray-600' 
                  : 'bg-gradient-to-r from-indigo-500 hover:from-indigo-400 hover:to-purple-500 to-purple-600 hover:scale-105 border border-indigo-400/50'}`}
          >
            {isLoopTriggered ? (
              <><span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span> Orchestrating...</>
            ) : (
              <><Activity className="h-5 w-5" /> Force Run Loop NOW</>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition">
           <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
             <Bot className="h-6 w-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Interventions</p>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,048</h3>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition">
           <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
             <CheckCircle className="h-6 w-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Rate</p>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">94.2%</h3>
           </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition">
           <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
             <Users className="h-6 w-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Logistic ELO</p>
             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,340</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Knowledge Base Uploader (Left Column) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <FileText className="text-blue-500 h-5 w-5" />
            Knowledge Base Ingestion
          </h2>
          <p className="text-sm text-textMuted mb-6">
            Upload campus circulars, hackathon PDFs, or schedules. The agent will read, vectorize, and remember this info for future chat resolution.
          </p>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {file ? file.name : "Drag and drop or click to select a PDF"}
            </p>
            <input 
              type="file" 
              accept=".pdf" 
              hidden 
              id="file-upload" 
              onChange={handleFileChange} 
            />
            <label 
              htmlFor="file-upload"
              className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-lg cursor-pointer font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
            >
              Browse Files
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Ingest into Agent DB
              </span>
            )}
          </button>
        </div>

        {/* Live Terminal Area (Right Column) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[500px]">
          <div className="bg-gray-100 dark:bg-black/40 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <TermIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
               <h2 className="text-sm font-mono font-bold text-gray-800 dark:text-gray-300 tracking-wider">AGENT_CORE_TERMINAL_V2.0</h2>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
          </div>
          
          <div ref={logContainerRef} className="p-5 font-mono text-sm overflow-y-auto flex-1 bg-gray-50 dark:bg-[#0a0f18]">
            {logs.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-4">
                  <Activity className="h-10 w-10 opacity-40 dark:opacity-20 text-gray-400 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-500">Awaiting intervention initialization...</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {logs.map((log, i) => {
                    let colorClass = "text-gray-700 dark:text-gray-300";
                    if (log.includes("[Trigger]")) colorClass = "text-yellow-600 dark:text-yellow-400 font-semibold";
                    if (log.includes("[Plan]")) colorClass = "text-blue-600 dark:text-blue-400";
                    if (log.includes("[Review]") || log.includes("SUCCESS")) colorClass = "text-green-600 dark:text-green-400 font-bold";
                    if (log.includes("[Update]")) colorClass = "text-purple-600 dark:text-purple-400";
                    if (log.includes("[Escalate]") || log.includes("Failed")) colorClass = "text-red-500 dark:text-red-400 font-bold dark:drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]";
                    
                    return (
                        <div key={i} className={`flex items-start gap-3 opacity-0 animate-in fade-in slide-in-from-left-4 duration-300 fill-mode-forwards`} style={{ animationDelay: `${i * 50}ms` }}>
                            <span className="text-emerald-500/80 dark:text-emerald-500/50 shrink-0">➜</span>
                            <span className={`${colorClass} leading-relaxed`}>{log}</span>
                        </div>
                    );
                 })}
                 {isLoopTriggered && (
                    <div className="flex items-center gap-2 text-indigo-400 mt-4 animate-pulse">
                       <span className="font-bold">_</span> Processing Neural Algorithms...
                    </div>
                 )}
                 <div ref={logEndRef} />
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Proactive Intelligence Feed */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-indigo-800/40 shadow-xl dark:shadow-2xl overflow-hidden mt-8">
        <div className="bg-gray-50 dark:bg-gradient-to-r dark:from-indigo-950 dark:to-purple-950 border-b border-gray-200 dark:border-indigo-800/40 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold tracking-wide">Proactive Intelligence Feed</h2>
              <p className="text-gray-500 dark:text-indigo-300 text-xs">System-initiated actions — no user input required</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700/50 px-3 py-1 rounded-full animate-pulse">
            ● LIVE
          </span>
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {proactiveActions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-600 font-mono">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-30 dark:opacity-20 text-gray-400" />
              <p className="text-sm">Agent has not self-triggered yet.</p>
              <p className="text-xs mt-1">Click <span className="text-indigo-600 dark:text-indigo-400">Execute Agent Loop</span> to activate proactive monitoring.</p>
            </div>
          ) : (
            proactiveActions.map((action, idx) => (
              <div key={action.timestamp + idx} className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 font-bold">⚡ Autonomous Action</span>
                    {action.flows_run.map(f => (
                      <span key={f} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">{f}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs shrink-0">
                    <Clock size={10} />{action.timestamp}
                  </div>
                </div>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs font-mono">🔔 Trigger: {action.trigger}</p>
                <p className="text-gray-800 dark:text-gray-300 text-sm">{action.summary}</p>
                <button
                  onClick={() => setExpandedTrace(expandedTrace === idx ? null : idx)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
                >
                  {expandedTrace === idx ? '▲ Hide trace' : '▼ Show reasoning trace'}
                </button>
                {expandedTrace === idx && (
                  <div className="font-mono text-xs space-y-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-none rounded-xl p-3 mt-1">
                    {action.trace.map((t, i) => (
                      <div key={i} className="flex gap-2">
                        <span className={`shrink-0 w-14 font-bold ${t.step === 'GOAL' ? 'text-blue-600 dark:text-blue-400' : t.step === 'PLAN' ? 'text-purple-600 dark:text-purple-400' : t.step === 'ACTION' ? 'text-yellow-600 dark:text-yellow-400' : t.step === 'RESULT' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.step}</span>
                        <span className="text-gray-700 dark:text-gray-300 break-all">{t.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Task Control Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-indigo-800/40 shadow-xl dark:shadow-2xl overflow-hidden mt-8">
        <div className="bg-gray-50 dark:bg-gradient-to-r dark:from-gray-900 dark:to-indigo-900 border-b border-gray-200 dark:border-indigo-800/40 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <BrainCircuit className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold tracking-wide text-lg">AI Task Control Panel</h2>
              <p className="text-gray-500 dark:text-indigo-300 text-xs">Full history of autonomous assignments & verifications</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700/50 rounded-full text-xs font-bold">🟡 Assigned</span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50 rounded-full text-xs font-bold">🔵 In Progress</span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700/50 rounded-full text-xs font-bold">🟢 Completed</span>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700/50 rounded-full text-xs font-bold">🔴 Failed</span>
          </div>
        </div>

        <div className="p-5">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
             {allTasks.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-500 font-mono">
                  <FileCode2 className="h-12 w-12 mx-auto mb-3 opacity-30 dark:opacity-20 text-gray-400" />
                  <p>No autonomous tasks have been assigned yet.</p>
                </div>
             ) : (
                allTasks.map(task => {
                  let statusColor = "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-700/30 text-yellow-700 dark:text-yellow-500/90";
                  let dotColor = "bg-yellow-500 dark:bg-yellow-400";
                  let statusLabel = "Assigned";
                  
                  if (task.status === 'completed') {
                    statusColor = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-700/30 text-green-700 dark:text-green-400";
                    dotColor = "bg-green-500 dark:bg-green-400";
                    statusLabel = "Completed";
                  } else if (task.status === 'failed') {
                    statusColor = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-400";
                    dotColor = "bg-red-500 dark:bg-red-400";
                    statusLabel = "Failed";
                  } else if (task.status === 'pending') {
                    statusColor = "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-700/30 text-blue-700 dark:text-blue-400";
                    dotColor = "bg-blue-500 dark:bg-blue-400";
                    statusLabel = "In Progress";
                  }

                  const isExpanded = expandedTask === task.id;

                  const renderDescription = (text: string) => {
                      if (!text) return null;
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const parts = text.split(urlRegex);
                      return parts.map((part, i) => {
                          if (part.match(urlRegex)) {
                              return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-blue-400 hover:text-indigo-500 dark:hover:text-blue-300 underline decoration-indigo-500/30 dark:decoration-blue-500/30 underline-offset-2" onClick={(e) => e.stopPropagation()}>{part}</a>;
                          }
                          return part;
                      });
                  };

                  return (
                    <div key={task.id} className={`p-4 rounded-2xl border transition-all ${statusColor} hover:bg-opacity-80 dark:hover:bg-opacity-20`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-gray-900 dark:text-gray-200">{task.member_name}</div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/5 dark:bg-black/40 text-xs font-semibold capitalize border border-black/10 dark:border-white/5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`}></span>
                          {statusLabel}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-3 leading-relaxed" title={task.description}>
                        {renderDescription(task.description)}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock size={12}/>{task.assigned_at?.split(' ')[0] || "Unknown Date"}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">{task.difficulty}</span>
                      </div>

                      <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                        <button 
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className="w-full flex items-center justify-between text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition"
                        >
                          {isExpanded ? 'Hide Verification' : 'View AI Verification'}
                          {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        
                        {isExpanded && (
                           <div className="mt-3 p-3 bg-gray-50 dark:bg-black/50 rounded-xl border border-gray-200 dark:border-white/5 text-xs font-mono text-emerald-600 dark:text-emerald-400/80 leading-relaxed overflow-x-auto">
                             {task.verification_log ? (
                               <div className="text-emerald-400 leading-relaxed">➜ {task.verification_log}</div>
                             ) : (
                               <div className="text-amber-500/80 italic animate-pulse">Waiting for next loop verifying LeetCode profile...</div>
                             )}
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAdmin;
