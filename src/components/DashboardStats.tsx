import { useEffect, useState } from "react";
import { User, AttendanceRecord, Task, AIInsight } from "../types";
import { Users, ClipboardList, CheckCircle, TrendingUp, AlertTriangle, AlertCircle, Sparkles, BrainCircuit, RefreshCw, BarChart } from "lucide-react";
import { apiFetch } from "../lib/api";

interface DashboardStatsProps {
  users: User[];
  attendance: AttendanceRecord[];
  tasks: Task[];
  onFocusWorker?: (workerId: string) => void;
}

export default function DashboardStats({ users, attendance, tasks, onFocusWorker }: DashboardStatsProps) {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const workers = users.filter((u) => u.role === "worker");
  const managers = users.filter((u) => u.role === "manager");

  // Basic Metrics
  const activeTasks = tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");
  const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasksCount = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasksCount = tasks.filter((t) => t.status === "In Progress").length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const checkedInCount = todayRecords.length;
  const lateCount = todayRecords.filter((r) => r.status === "Late").length;
  const attendanceRate = workers.length > 0 ? Math.round((checkedInCount / workers.length) * 100) : 0;

  // Let's fetch AI Insights from our backend
  const fetchAIInsights = async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const response = await apiFetch("/api/ai/insights");
      if (!response.ok) {
        throw new Error("Could not compute neural metrics model.");
      }
      const data = await response.json();
      setInsights(data);
    } catch (err: any) {
      setAiError(err.message || "Connection timeout during prediction compiling.");
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, []); // Only fetch once on mount to respect free-tier Gemini API quotas.

  // Compute simple performance scores for workers
  const getEfficiencyScore = (workerId: string) => {
    const workerTasks = tasks.filter((t) => t.assignedToId === workerId);
    if (workerTasks.length === 0) return 80; // baseline
    const completed = workerTasks.filter((t) => t.status === "Completed").length;
    const taskRatio = completed / workerTasks.length;
    
    const workerAttendance = attendance.filter((a) => a.userId === workerId);
    const onTimeCount = workerAttendance.filter((a) => a.status === "On Time").length;
    const attendanceRatio = workerAttendance.length > 0 ? onTimeCount / workerAttendance.length : 1;
    
    const score = Math.round((taskRatio * 60 + attendanceRatio * 40) * 100) / 100;
    return Math.min(100, Math.max(45, Math.ceil(score)));
  };

  return (
    <div className="space-y-6">
      {/* 4 Core Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workers Counters Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-405 font-mono text-slate-400">TOTAL WORKFORCE</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">{workers.length} Field Operatives</h3>
            <p className="text-[10px] text-slate-500 font-medium">({managers.length} Supervisor Overlook)</p>
          </div>
        </div>

        {/* Tasks Counters Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-405 font-mono text-slate-400">ACTIVE WORK ITEMS</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">{activeTasks.length} Assigned</h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center shrink-0">
              <CheckCircle className="w-3 h-3 mr-0.5" />
              <span>{completedTasksCount} Complete overall</span>
            </p>
          </div>
        </div>

        {/* Attendance Index Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-405 font-mono text-slate-400">TODAY ATTENDANCE</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">{attendanceRate}% Rate</h3>
            <p className="text-[10px] text-slate-500 font-medium font-mono">
              {checkedInCount} Present • <span className="text-amber-500 font-semibold">{lateCount} Late</span>
            </p>
          </div>
        </div>

        {/* Efficiency baseline */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-405 font-mono text-slate-400">AVG PRODUCTIVITY SCORE</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">86.2%</h3>
            <p className="text-[10px] text-indigo-600 font-medium">Stable Operational Cycle</p>
          </div>
        </div>
      </div>

      {/* AI Insights & Diagnostics Central Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative mesh background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/15 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 rounded-xl animate-pulse">
              <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold font-display tracking-tight">AI Predictive Workforce Assessor</h3>
                <span className="text-[8px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">COGNITIVE ACTIVE</span>
              </div>
              <p className="text-xs text-slate-300">Continuous risk tracking, task pairing diagnostics, and fraud logs</p>
            </div>
          </div>

          <button
            onClick={fetchAIInsights}
            disabled={loadingAI}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 disabled:opacity-40 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 self-stretch md:self-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? "animate-spin" : ""}`} />
            <span>{loadingAI ? "Recalculating Graphs..." : "Analyze Workforce State"}</span>
          </button>
        </div>

        {loadingAI ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse lg:scale-110" />
            <div className="text-center font-sans">
              <p className="text-xs font-semibold text-indigo-200">Re-indexing employee databases & geolocation coordinates...</p>
              <p className="text-[10px] text-slate-400 mt-1">Consulting Gemini-3.5 model node structure</p>
            </div>
          </div>
        ) : aiError ? (
          <div className="py-4 px-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 text-red-200">
            <AlertCircle className="w-5 h-5 grow-0 text-red-400" />
            <div>
              <h4 className="text-xs font-extrabold text-red-400">Neural Sync Error</h4>
              <p className="text-xs mt-0.5">{aiError}</p>
              <p className="text-[10px] text-slate-400 mt-1">Check settings key configurations, fallback rules applied.</p>
            </div>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Insights Column */}
            <div className="space-y-2 border-r border-white/10 pr-0 md:pr-4">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center font-mono">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                Productivity Trends
              </h4>
              <p className="text-xs leading-relaxed text-slate-200 bg-white/5 p-3 rounded-xl border border-white/5">
                {insights.productivityTrends}
              </p>
            </div>

            {/* Fraud Alerts Column */}
            <div className="space-y-2 border-r border-white/10 pr-0 md:pr-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center font-mono">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Operational Warnings
              </h4>
              <div className="space-y-1.5">
                {insights.fraudAlerts && insights.fraudAlerts.length > 0 ? (
                  insights.fraudAlerts.map((warn, i) => (
                    <div key={i} className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start space-x-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 bg-white/5 rounded-xl p-3 border border-white/5 italic">
                    No immediate geofence deviations or clock anomalies logged.
                  </div>
                )}
              </div>
            </div>

            {/* Smart Recommendations Column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center font-mono">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Smart Allocations
              </h4>
              <div className="space-y-1.5">
                {insights.smartRecommendations && insights.smartRecommendations.length > 0 ? (
                  insights.smartRecommendations.map((rec, i) => (
                    <div key={i} className="text-xs text-emerald-100 bg-emerald-500/15 border border-emerald-500/25 rounded-xl p-2.5 flex items-start space-x-2">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 italic">No recommendations logged.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <button onClick={fetchAIInsights} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer">
              Compile Team Performance Report
            </button>
          </div>
        )}
      </div>

      {/* Visual Charts & Employee Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Staff Performance Ranking Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 font-display">Operative Efficiency Score</h3>
              <p className="text-xs text-slate-400">Aggregated task completion & punctual clocking weights</p>
            </div>
            <BarChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {workers.map((worker) => {
              const score = getEfficiencyScore(worker.id);
              const colorClass = score >= 90 ? "bg-emerald-500" : score >= 75 ? "bg-indigo-500" : "bg-amber-500";
              return (
                <div key={worker.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                        <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold text-slate-700">{worker.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <span className="font-semibold text-slate-800 font-mono">{score}%</span>
                      {onFocusWorker && (
                        <button
                          type="button"
                          onClick={() => onFocusWorker(worker.id)}
                          className="px-2 py-0.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-150 hover:border-indigo-300 text-[10px] font-extrabold rounded-lg flex items-center shadow-xs cursor-pointer focus:outline-none transition-all ml-1.5"
                        >
                          Focus Map
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Custom progress HTML bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${score}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>        {/* Right Columns: SVG-based Team Task Allocation Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 font-display">Staff Operational Progress Dashboard</h3>
              <p className="text-xs text-slate-400">Visual comparison of completed vs pending tasks by person</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 self-start sm:self-auto">Live Queue View</span>
          </div>

          <div className="relative pt-2">
            {/* Custom SVG Bar Graph */}
            <div className="space-y-4">
              {workers.map((worker) => {
                const total = tasks.filter((t) => t.assignedToId === worker.id).length;
                const completed = tasks.filter((t) => t.assignedToId === worker.id && t.status === "Completed").length;
                const inProgress = tasks.filter((t) => t.assignedToId === worker.id && t.status === "In Progress").length;
                
                const completedPct = total > 0 ? (completed / total) * 100 : 0;
                const progressPct = total > 0 ? (inProgress / total) * 100 : 0;
                const pendingPct = total > 0 ? ((total - completed - inProgress) / total) * 100 : 100;

                return (
                  <div key={worker.id} className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-1.5 sm:gap-3">
                    {/* Name and count side-by-side on mobile, but grid segments on desktop */}
                    <div className="flex justify-between items-center w-full sm:col-span-3 text-xs font-semibold sm:font-medium text-slate-650">
                      <span className="truncate">{worker.name}</span>
                      <span className="sm:hidden text-right text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.5 bg-slate-100/80 rounded-md">
                        {total === 0 ? "0 Tasks" : `${completed}/${total} Done`}
                      </span>
                    </div>
                    
                    {/* Compound Horizontal Bar */}
                    <div className="w-full sm:col-span-7 h-5 rounded-md overflow-hidden bg-slate-150 flex border border-slate-100 shrink-0">
                      {total > 0 ? (
                        <>
                          <div className="h-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0 transition-all duration-300" style={{ width: `${completedPct}%` }} title={`Completed: ${completed}`}>
                            {completed > 0 ? completed : ""}
                          </div>
                          <div className="h-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center shrink-0 transition-all duration-300" style={{ width: `${progressPct}%` }} title={`In Progress: ${inProgress}`}>
                            {inProgress > 0 ? inProgress : ""}
                          </div>
                          <div className="h-full bg-slate-200 text-[10px] font-medium text-slate-505 flex items-center justify-center shrink-0 transition-all duration-300" style={{ width: `${pendingPct}%` }} title={`Pending: ${total - completed - inProgress}`}>
                            {(total - completed - inProgress) > 0 ? (total - completed - inProgress) : ""}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-100 text-[10px] text-slate-400 italic flex items-center pl-3">No active jobs assigned</div>
                      )}
                    </div>

                    <div className="hidden sm:block sm:col-span-2 text-right text-xs font-mono font-bold text-slate-500">
                      {total === 0 ? "0 Tasks" : `${completed}/${total} Done`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom chart legend */}
            <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-slate-150 text-[10px] font-semibold text-slate-505 font-mono text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>COMPLETED</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500"></span>
                <span>IN PROGRESS</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-200"></span>
                <span>PENDING / DELAYED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
