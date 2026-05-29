import React, { useState } from "react";
import { Task, User } from "../types";
import { Plus, Check, Clipboard, Calendar, Clock, AlertTriangle, CheckCircle, Sparkles, Wand2, Compass, Eye, UserPlus } from "lucide-react";
import { apiFetch } from "../lib/api";

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  loggedInUser: User;
  onAddTask: (taskData: any) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: string, comment?: string) => Promise<void>;
}

export default function TaskBoard({
  tasks,
  users,
  loggedInUser,
  onAddTask,
  onUpdateTaskStatus
}: TaskBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [category, setCategory] = useState("Field Service");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86450000).toISOString().substring(0, 10));
  const [address, setAddress] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiReason, setAiReason] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [statusComment, setStatusComment] = useState("");

  const workers = users.filter((u) => u.role === "worker");
  const canAssign = loggedInUser.role === "admin" || loggedInUser.role === "manager";

  // Pre-seed coordinates dictionary based on address terms for neat Leaflet plotting
  const getCoordinatesForAddress = (addr: string) => {
    const term = addr.toLowerCase();
    if (term.includes("times square")) return { lat: 40.7580, lng: -73.9855 };
    if (term.includes("empire state")) return { lat: 40.7484, lng: -73.9857 };
    if (term.includes("brooklyn bridge") || term.includes("dumbo")) return { lat: 40.7061, lng: -73.9969 };
    if (term.includes("central park")) return { lat: 40.7851, lng: -73.9682 };
    if (term.includes("queens")) return { lat: 40.7282, lng: -73.7949 };
    // Default inside standard NY zone
    return {
      lat: 40.7128 + (Math.random() - 0.5) * 0.05,
      lng: -74.0060 + (Math.random() - 0.5) * 0.05
    };
  };

  // AI Task Allocator Call
  const handleAIAllocation = async () => {
    if (!title || !category) {
      setAiReason("Please fill in the Task Title and Category first to run AI allocation diagnostics.");
      return;
    }
    setAiLoading(true);
    setAiReason(null);
    try {
      const response = await apiFetch("/api/ai/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category })
      });
      if (!response.ok) throw new Error("Optimization failed.");
      const result = await response.json();
      
      if (result.recommendedWorkerId) {
        setAssignedToId(result.recommendedWorkerId);
        setAiReason(`💡 Recommended assignee: ${result.recommendedWorkerName}. \nReasoning: ${result.reasoning}`);
      }
    } catch (err: any) {
      setAiReason("Failed to compile candidate allocation metrics. Fallback mapping applied.");
      // Auto-assign nearest match as heuristic
      if (workers.length > 0) setAssignedToId(workers[0].id);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedToId) return;

    const coords = getCoordinatesForAddress(address || title);

    await onAddTask({
      title,
      description,
      assignedToId,
      priority,
      deadline,
      category,
      address: address || "Midtown Manhattan, NYC",
      lat: coords.lat,
      lng: coords.lng
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setAssignedToId("");
    setPriority("Medium");
    setAddress("");
    setAiReason(null);
    setShowAddForm(false);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await onUpdateTaskStatus(taskId, newStatus, statusComment);
    setStatusComment("");
    setSelectedTaskDetail(null);
  };

  // Filter tasks based on role and filter queries
  const visibleTasks = tasks.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchRole = loggedInUser.role !== "worker" || t.assignedToId === loggedInUser.id;
    return matchStatus && matchRole;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "High": return "bg-red-100 text-red-800 border-red-250";
      case "Medium": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Completed": return "bg-emerald-100 text-emerald-800";
      case "In Progress": return "bg-blue-105 bg-indigo-50 text-indigo-800 border border-indigo-150";
      case "Delayed": return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Cancelled": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Field Assignments</h2>
          <p className="text-xs text-slate-500">Track and manage active work orders across sectors</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {canAssign && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-750 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Creation Form Panel */}
      {showAddForm && canAssign && (
        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 max-w-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clipboard className="w-4 h-4 text-indigo-500" />
              <span>Register New Work Assignment</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-650"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Task Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Fiber Link Alignment Node C"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Operations Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
              >
                <option value="Field Service font-semibold">🔧 Field Service Diagnostic</option>
                <option value="Broadband Setup">📡 Telecom/Fiber Operations</option>
                <option value="Delivery">🚚 Express Cargo Delivery</option>
                <option value="Safety & Audit">🛡️ Compliance Safety Inspection</option>
                <option value="General Duties">🛠️ General Shift Assignment</option>
              </select>
            </div>

            <div className="space-y-1 col-span-1 md:col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600">Assigned Operative</label>
                <button
                  type="button"
                  onClick={handleAIAllocation}
                  disabled={aiLoading}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-600 rounded-md text-[10px] font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Run AI algorithm match"
                >
                  <Wand2 className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
                  <span>AI Auto-Match</span>
                </button>
              </div>
              <select
                required
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50 font-medium"
              >
                <option value="">-- Choose Field Worker --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 col-span-1">Target Geofence Location / Address</label>
              <input
                type="text"
                placeholder="e.g. Times Square, NY (For interactive coordinate mapping)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 col-span-1">Priority Weight</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
              >
                <option value="Low">Low - standard queues</option>
                <option value="Medium">Medium - target within schedule</option>
                <option value="High">🚨 High - immediate deployment</option>
              </select>
            </div>

            <div className="space-y-1 col-span-1">
              <label className="text-xs font-bold text-slate-600">Completion Deadline</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Task Directions & Scope Description</label>
            <textarea
              rows={3}
              placeholder="Provide procedural safety guidelines and explicit check-in instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
            />
          </div>

          {aiReason && (
            <div className="bg-indigo-50/70 border border-indigo-150 p-3 rounded-lg text-[11px] text-indigo-900 leading-relaxed font-sans space-y-1 font-medium animate-fade-in">
              <p className="flex items-center text-indigo-700 font-extrabold"><Sparkles className="w-3.5 h-3.5 mr-1" /> CORE AI ENGINE SCHEDULER</p>
              <p className="whitespace-pre-line">{aiReason}</p>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              Dispatch Order
            </button>
          </div>
        </form>
      )}

      {/* Task List Selector Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap gap-2 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono mr-2 shrink-0">FILTERS:</span>
          {["all", "Pending", "In Progress", "Completed", "Delayed", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-650"
              }`}
            >
              {st === "all" ? "All Shifts" : st}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono font-medium">{visibleTasks.length} Assignments found</span>
      </div>

      {/* Tasks Grid Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Clipboard className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-slate-700 font-display">No active assignments recorded</h4>
            <span className="text-xs text-slate-400">All shifts are currently complete and synchronized</span>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTaskDetail(task);
                setStatusComment("");
              }}
              className="bg-white border border-slate-200/60 rounded-2xl p-4.5 flex flex-col justify-between hover:border-indigo-250 hover:shadow-md transition-all relative group cursor-pointer"
            >
              <div>
                {/* Priority Label & Status indicator */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${getPriorityColor(task.priority)}`}>
                    {task.priority} Queue
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm font-display mb-1.5">
                  {task.title}
                </h3>
                
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {task.description}
                </p>

                {/* Assignment specifics */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3 mb-4 text-[11px] text-slate-600">
                  <div className="flex items-center space-x-1.5 text-slate-550">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Target Date: <strong>{task.deadline}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 line-clamp-1">
                    <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Geofence: <strong>{task.location?.address}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Assignee: <strong className="text-slate-800">{task.assignedToName}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Action footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {task.id}</span>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering card-level toggle twice
                    setSelectedTaskDetail(task);
                    setStatusComment("");
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 font-semibold text-xs text-slate-700 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-slate-505" />
                  <span>Update Order</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Work Detail and State Change Transition Modal Overlay */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getPriorityColor(selectedTaskDetail.priority)}`}>
                  {selectedTaskDetail.priority} Priority
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display mt-1.5 leading-tight">{selectedTaskDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 hover:bg-stone-50 rounded-lg transition-colors focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-658 leading-relaxed">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Assignment Scope</h4>
                <p className="text-slate-600 mt-1">{selectedTaskDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-y border-slate-100 py-3.5 text-slate-500 font-medium">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Category</p>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedTaskDetail.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Deadline Date</p>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedTaskDetail.deadline}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Target Address</p>
                  <p className="text-slate-705 mt-0.5 line-clamp-1">{selectedTaskDetail.location?.address}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Work Dispatcher</p>
                  <p className="text-slate-800 font-bold mt-0.5">{selectedTaskDetail.assignedByName}</p>
                </div>
              </div>

              {/* Status Update Controllers */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-800">Log Operational Update</h4>
                
                {/* Quick Status switches */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Pending", "In Progress", "Completed", "Delayed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedTaskDetail.id, st)}
                      className={`py-2 px-2.5 rounded-lg text-center text-xs font-bold transition-all border cursor-pointer ${
                        selectedTaskDetail.status === st
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-750 border-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Activity Comment / Obstacle Update</label>
                  <input
                    type="text"
                    placeholder="e.g. Completed initial calibration. Cable losses optimized to 0.1dB."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              {/* Historic Update Timeline list */}
              {selectedTaskDetail.updates && selectedTaskDetail.updates.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3.5">
                  <h4 className="font-bold text-slate-800">Workforce Action Trail</h4>
                  
                  <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                    {selectedTaskDetail.updates.map((up) => (
                      <div key={up.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 font-sans">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1 font-mono">
                          <span>👤 {up.updatedBy}</span>
                          <span>{new Date(up.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-semibold">
                          Transitioned status from <span className="text-slate-500 line-through shrink-0">{up.statusFrom}</span> → <span className="text-indigo-600">{up.statusTo}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1 bg-white p-1.5 rounded-md border border-slate-100 font-medium italic">
                          "{up.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
