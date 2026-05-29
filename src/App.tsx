import React, { useEffect, useState, useRef } from "react";
import { User, AttendanceRecord, Task, GPSLog, TeamAnnouncement, ChatMessage, PayrollRecord, SafetyIncident, SOSAlert } from "./types";
import {
  Compass,
  Users,
  ClipboardList,
  Clock,
  Wallet,
  Megaphone,
  LogOut,
  Sparkles,
  UserCheck,
  Menu,
  X,
  ShieldCheck,
  Smartphone,
  Navigation,
  CheckCircle,
  HelpCircle,
  Zap,
  ShieldAlert,
  ChevronDown,
  Upload,
  Camera
} from "lucide-react";

// Sub-components
import MapTracking from "./components/MapTracking";
import DashboardStats from "./components/DashboardStats";
import TaskBoard from "./components/TaskBoard";
import AttendanceCard from "./components/AttendanceCard";
import PayrollSection from "./components/PayrollSection";
import CommunicationsPanel from "./components/CommunicationsPanel";
import SafetySection from "./components/SafetySection";
import AdminWorkspace from "./components/AdminWorkspace";

import { apiFetch, isUsingLocalFallback, forceBackendCheck } from "./lib/api";

export default function App() {
  // Session details stored in state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usingFallback, setUsingFallback] = useState(isUsingLocalFallback());
  
  // Registration and Logging forms
  const [loginEmail, setLoginEmail] = useState("");
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    role: "worker",
    department: "Field Engineering",
    designation: "Field Technician",
    phone: "",
    skills: "",
    hourlyRate: "25"
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"login" | "register">("login");

  // Core system databases retrieved from server
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [gpsLogs, setGpsLogs] = useState<GPSLog[]>([]);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);

  // Navigation and focus
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedWorkerMapFocus, setSelectedWorkerMapFocus] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Modal/Menu States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);

  const compressAndSetAvatarFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setProfileErrorMsg("Please select a valid image file.");
      return;
    }
    setProfileErrorMsg("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max_size = 120; // compact avatar is fine
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            setProfileAvatarUrl(dataUrl);
          } catch (err) {
            console.error("Failed to compile image to base64 canvas:", err);
            setProfileErrorMsg("Error rendering image.");
          }
        }
      };
      img.onerror = () => {
        setProfileErrorMsg("Could not load image.");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setProfileErrorMsg("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser, isProfileOpen]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      const response = await apiFetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          avatarUrl: profileAvatarUrl
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setCurrentUser(updated);
        localStorage.setItem("workforce_user_session", JSON.stringify(updated));
        fetchAllTelemetry();
        setProfileSuccessMsg("Profile updated successfully!");
        setTimeout(() => {
          setProfileSuccessMsg("");
          setIsProfileOpen(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Simulated Continuous Moving interval dictionary
  const [isWorkerTravelingSim, setIsWorkerTravelingSim] = useState<Record<string, boolean>>({});
  const travelIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  // 1. Core Loader Engine (Pulls metrics from server)
  const fetchAllTelemetry = async () => {
    try {
      const [uRes, aRes, tRes, gRes, anRes, chRes, pRes, sIncRes, sSosRes] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/attendance"),
        apiFetch("/api/tasks"),
        apiFetch("/api/gps"),
        apiFetch("/api/announcements"),
        apiFetch("/api/chats"),
        apiFetch("/api/payroll"),
        apiFetch("/api/safety/incidents"),
        apiFetch("/api/safety/sos")
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAttendance(await aRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (gRes.ok) setGpsLogs(await gRes.json());
      if (anRes.ok) setAnnouncements(await anRes.json());
      if (chRes.ok) setChats(await chRes.json());
      if (pRes.ok) setPayroll(await pRes.json());
      if (sIncRes.ok) setSafetyIncidents(await sIncRes.json());
      if (sSosRes.ok) setSosAlerts(await sSosRes.json());
    } catch (e) {
      console.error("Telemetry server polling failed:", e);
    } finally {
      setUsingFallback(isUsingLocalFallback());
    }
  };

  // Automated Synchronization Engine - Every 5 Seconds
  useEffect(() => {
    fetchAllTelemetry();

    const pollTimer = setInterval(() => {
      fetchAllTelemetry();
    }, 5010);

    return () => {
      clearInterval(pollTimer);
      // Clean up any surviving driving thread mock integrations
      Object.values(travelIntervals.current).forEach((timer) => clearInterval(timer as any));
    };
  }, []);

  // Sync session details with state if already logged in previously
  useEffect(() => {
    const saved = localStorage.getItem("workforce_user_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("workforce_user_session");
      }
    }
  }, []);

  // Lock body scroll on mobile side-menu open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // 2. Authentication handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Login verification failed.");
      }

      const body = await response.json();
      setCurrentUser(body.user);
      localStorage.setItem("workforce_user_session", JSON.stringify(body.user));
    } catch (err: any) {
      setAuthError(err.message || "Email address is not preseeded in database.");
    } finally {
      setUsingFallback(isUsingLocalFallback());
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const payload = {
        ...registerForm,
        skills: registerForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(registerForm.hourlyRate) || 20
      };

      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Worker registration rejected.");
      }

      const body = await response.json();
      // Log the newly registered employee immediately for smooth testing flow
      setCurrentUser(body.user);
      localStorage.setItem("workforce_user_session", JSON.stringify(body.user));
      setViewState("login");
      fetchAllTelemetry();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setUsingFallback(isUsingLocalFallback());
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("workforce_user_session");
    // Stop all driving threads
    Object.values(travelIntervals.current).forEach((timer) => clearInterval(timer as any));
    travelIntervals.current = {};
    setIsWorkerTravelingSim({});
  };

  // Direct single-tap log in bypass
  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setAuthError(null);
    setTimeout(async () => {
      try {
        const response = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (response.ok) {
          const body = await response.json();
          setCurrentUser(body.user);
          localStorage.setItem("workforce_user_session", JSON.stringify(body.user));
        }
      } catch (err) {
        console.error("Quick bypass failure", err);
      } finally {
        setUsingFallback(isUsingLocalFallback());
      }
    }, 150);
  };

  // 3. Dynamic Interactive Actions on backend

  // Clock In
  const handleClockIn = async (loc: { lat: number; lng: number; address: string }) => {
    if (!currentUser) return;
    const response = await apiFetch("/api/attendance/clockin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, lat: loc.lat, lng: loc.lng, address: loc.address })
    });
    if (!response.ok) throw new Error("Check-in error");
    fetchAllTelemetry();
  };

  // Clock Out
  const handleClockOut = async (loc: { lat: number; lng: number; address: string }) => {
    if (!currentUser) return;
    const response = await apiFetch("/api/attendance/clockout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, lat: loc.lat, lng: loc.lng, address: loc.address })
    });
    if (!response.ok) throw new Error("Check-out deviation error");
    fetchAllTelemetry();
  };

  // Update/Approve Attendance
  const handleUpdateAttendance = async (id: string, updates: any) => {
    const response = await apiFetch(`/api/attendance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Create Assignment Task
  const handleAddTaskSubmit = async (taskData: any) => {
    const response = await apiFetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Update Task Queue
  const handleUpdateTaskStatus = async (taskId: string, status: string, comment?: string) => {
    const response = await apiFetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment, updatedBy: currentUser?.name || "System" })
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Update Payout ledgers
  const handleUpdatePayroll = async (id: string, updates: any) => {
    const response = await apiFetch(`/api/payroll/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Update User profiles (for Admins)
  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    const response = await apiFetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      // If updating oneself, update local state as well
      if (currentUser && currentUser.id === id) {
        const updated = await response.json();
        setCurrentUser(updated);
      }
      fetchAllTelemetry();
    }
  };

  // Broadcast Alert
  const handleAddAnnouncement = async (annData: any) => {
    const response = await apiFetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annData)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Radio Chat Log
  const handleSendMessage = async (chatData: any) => {
    const response = await apiFetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatData)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Trigger Safety SOS
  const handleTriggerSOS = async (sosData: any) => {
    const response = await apiFetch("/api/safety/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sosData)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Resolve Safety SOS
  const handleResolveSOS = async (sosId: string) => {
    const response = await apiFetch(`/api/safety/sos/${sosId}/resolve`, {
      method: "PUT"
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Report Safety Incident
  const handleAddIncident = async (incData: any) => {
    const response = await apiFetch("/api/safety/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incData)
    });
    if (response.ok) fetchAllTelemetry();
  };

  // Focus operative coordinate on open OSM map panel
  const handleFocusWorkerOnMap = (workerId: string) => {
    setSelectedWorkerMapFocus(workerId);
    setActiveTab("map");
  };

  // 4. Live Worker Travel Emulation Engine
  // Iterates the selected worker coordinates along standard roadways to showcase interactive Leaflet
  const handleSimulateTravelMove = (workerId: string) => {
    // If already active, toggle off
    if (isWorkerTravelingSim[workerId]) {
      clearInterval(travelIntervals.current[workerId]);
      delete travelIntervals.current[workerId];
      setIsWorkerTravelingSim((prev) => ({ ...prev, [workerId]: false }));
      
      // Reset worker status to regular on server
      apiFetch("/api/gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: workerId, latitude: 40.7580, longitude: -73.9855, status: "Working" })
      }).then(() => fetchAllTelemetry());
      return;
    }

    setIsWorkerTravelingSim((prev) => ({ ...prev, [workerId]: true }));
    
    // Find initial coordinat or center of Times Square NYC
    const existingLog = gpsLogs.find((g) => g.userId === workerId);
    let lat = existingLog ? existingLog.latitude : 40.7580;
    let lgn = existingLog ? existingLog.longitude : -73.9855;
    
    // Increment paths heading southwest down Broadway or custom offsets
    let stepsCounter = 0;
    const driveInterval = setInterval(() => {
      stepsCounter++;
      
      // Broadway-like navigation offsets heading southwestward
      lat -= 0.0012; 
      lgn += 0.0007;

      // Update coordination state via server PUT route
      apiFetch("/api/gps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: workerId,
          latitude: lat,
          longitude: lgn,
          status: "Traveling",
          batteryLevel: Math.max(10, (existingLog?.batteryLevel || 90) - Math.floor(stepsCounter / 2))
        })
      }).then(async (res) => {
        if (res.ok) {
          const updatedLog = await res.json();
          // Update local logs list state directly
          setGpsLogs((prev) => prev.map((g) => (g.userId === workerId ? updatedLog : g)));
        }
      });

      // Cap emulation drive to 25 ticks, then auto-rest complete smoothly
      if (stepsCounter >= 25) {
        clearInterval(travelIntervals.current[workerId]);
        delete travelIntervals.current[workerId];
        setIsWorkerTravelingSim((prev) => ({ ...prev, [workerId]: false }));
        
        apiFetch("/api/gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: workerId, latitude: lat, longitude: lgn, status: "Working" })
        }).then(() => fetchAllTelemetry());
      }
    }, 2800);

    travelIntervals.current[workerId] = driveInterval;
  };

  // Render Login state before accessing layout
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        
        {/* Ambient aesthetic geometry backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-850 shadow-2xl overflow-hidden relative z-10 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Compass className="w-8 h-8 animate-spin-slow text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">Work Pulse</h1>
            <p className="text-xs font-medium text-slate-500">Your Workforce Management System: scheduling, attendance check-in & GPS tracking</p>
          </div>

          {viewState === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Pre-Registered email address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@workforce.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl p-3 bg-slate-50 text-slate-820 font-medium"
                />
              </div>

              {authError && <p className="text-[11px] font-semibold text-red-500">{authError}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-655 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Sign In to System Terminal
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:outline-none rounded-xl p-2.5 bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@workforce.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full text-xs border border-slate-200 focus:outline-none rounded-xl p-2.5 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Operations Role</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 bg-white"
                  >
                    <option value="worker">Worker / Employee</option>
                    <option value="manager">Team Manager / Supervisor</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Department</label>
                  <select
                    value={registerForm.department}
                    onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 bg-white"
                  >
                    <option value="Field Engineering">Field Engineering</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Safety & Audit">Safety & Audit</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Designation</label>
                  <select
                    value={registerForm.designation}
                    onChange={(e) => setRegisterForm({ ...registerForm, designation: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 bg-white"
                  >
                    <option value="Field Technician">Field Technician</option>
                    <option value="Fibers/Telecom Engineer">Fibers/Telecom Engineer</option>
                    <option value="Senior Technician">Senior Technician</option>
                    <option value="Delivery Coordinator">Delivery Coordinator</option>
                    <option value="Compliance Inspector">Compliance Inspector</option>
                    <option value="Senior Supervisor">Senior Supervisor</option>
                    <option value="Chief Director">Chief Director</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={registerForm.hourlyRate}
                    onChange={(e) => setRegisterForm({ ...registerForm, hourlyRate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Fiber Splicing, Fiber diagnostic, HVAC"
                  value={registerForm.skills}
                  onChange={(e) => setRegisterForm({ ...registerForm, skills: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                />
              </div>

              {authError && <p className="text-[11px] font-bold text-red-500">{authError}</p>}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Register
              </button>
            </form>
          )}

          <div className="text-center text-xs">
            {viewState === "login" ? (
              <p className="text-slate-500">
                Registering a new operative?{" "}
                <button
                  onClick={() => { setViewState("register"); setAuthError(null); }}
                  className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
                >
                  Register Here
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                Already registered?{" "}
                <button
                  onClick={() => { setViewState("login"); setAuthError(null); }}
                  className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Unobtrusive, delicate connection badge completely separate from the design layout card */}
        <div className="absolute bottom-3 right-4 z-10 flex items-center space-x-1.5 opacity-60 hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-850 text-[9px] font-medium text-slate-400">
          <span className={`w-1.5 h-1.5 rounded-full ${usingFallback ? "bg-amber-500 animate-pulse-slow" : "bg-emerald-500"}`}></span>
          <span>{usingFallback ? "Local DB Emulation" : "Live Backend Synced"}</span>
          {usingFallback && (
            <button
              type="button"
              onClick={() => {
                forceBackendCheck();
                setUsingFallback(false);
                setAuthError(null);
              }}
              className="text-[9px] text-amber-500 hover:text-amber-400 underline font-semibold ml-1 cursor-pointer"
            >
              Retry Sync
            </button>
          )}
        </div>
      </div>
    );
  }

  // Define tab navigation elements depending on loggedInUser role
  const getTabBadge = (id: string) => {
    switch (id) {
      case "overview": return "Summary";
      case "assignments": return "Shifts";
      case "map": return "Live GPS";
      case "attendance": return "Check-In";
      case "payroll": return "Accounting";
      case "announcements": return "Notices & Announcements";
      case "safety": return "Safety SOS";
      case "workforce": return "Admin Portal";
      default: return "";
    }
  };

  const getTabLabelIcon = (id: string) => {
    switch (id) {
      case "overview": return <Users className="w-4 h-4 shrink-0" />;
      case "assignments": return <ClipboardList className="w-4 h-4 shrink-0" />;
      case "map": return <Compass className="w-4 h-4 shrink-0" />;
      case "attendance": return <Clock className="w-4 h-4 shrink-0" />;
      case "payroll": return <Wallet className="w-4 h-4 shrink-0" />;
      case "safety": return <ShieldAlert className="w-4 h-4 shrink-0" />;
      case "workforce": return <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />;
      default: return <Megaphone className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Main Indigo Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Burger menus on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 px-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-white block lg:hidden focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="inline-flex p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight font-display">Workforce Command Panel</h1>
              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase border border-indigo-500/30 font-mono tracking-widest hidden sm:inline">Active telemetry</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Coordinates tracker & AI allocation ledger</p>
          </div>
        </div>

        {/* User context & custom profile menu */}
        <div className="relative z-50 text-xs text-slate-800">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 hover:bg-slate-800/60 p-1.5 px-2.5 rounded-xl transition-colors cursor-pointer text-left focus:outline-none border border-transparent hover:border-slate-800"
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="font-bold text-slate-100 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 mr-1" />
                <span>{currentUser.name}</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                {currentUser.role} • {currentUser.department}
              </span>
            </div>
            <div className="w-8.5 h-8.5 rounded-full overflow-hidden border-2 border-indigo-500 bg-indigo-950 shrink-0">
              <img referrerPolicy="no-referrer" src={profileAvatarUrl || currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>
  
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-76 sm:w-80 bg-white text-slate-800 rounded-2xl border border-slate-200/90 shadow-2xl p-4.5 space-y-4 font-sans leading-normal">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-indigo-500 bg-slate-100 shrink-0">
                  <img referrerPolicy="no-referrer" src={profileAvatarUrl || currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 tracking-tight leading-normal">{currentUser.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5">{currentUser.role} • {currentUser.department}</p>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 tracking-wide uppercase block">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs font-semibold focus:outline-none border border-slate-200 focus:border-indigo-500 rounded-xl p-2.5 bg-slate-50 text-slate-800"
                    placeholder="Enter Name"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-600 tracking-wide uppercase block">Custom Profile Photo</label>
                  
                  {/* Drag and Drop Zone with click support */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(true);
                    }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingAvatar(false);
                      compressAndSetAvatarFiles(e.dataTransfer.files);
                    }}
                    onClick={() => {
                      document.getElementById("avatar-file-input")?.click();
                    }}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 ${
                      isDraggingAvatar 
                        ? "border-indigo-500 bg-indigo-50/50" 
                        : "border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/80"
                    }`}
                  >
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        compressAndSetAvatarFiles(e.target.files);
                      }}
                    />
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Upload from device
                    </span>
                    <span className="text-[9px] text-slate-400 block font-medium">
                      Drag & drop image here or click to browse
                    </span>
                  </div>

                  {profileErrorMsg && (
                    <div className="text-[10px] font-bold text-center text-rose-500 bg-rose-50 rounded-lg p-1.5 border border-rose-100">
                      {profileErrorMsg}
                    </div>
                  )}

                  {/* Or Optional input for URL */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Or Paste Photo URL</span>
                    <input
                      type="url"
                      value={profileAvatarUrl.startsWith("data:") ? "" : profileAvatarUrl}
                      onChange={(e) => {
                        setProfileAvatarUrl(e.target.value);
                        setProfileErrorMsg("");
                      }}
                      className="w-full text-[11px] font-medium focus:outline-none border border-slate-200 focus:border-indigo-500 rounded-xl p-2 bg-slate-50 text-slate-800"
                      placeholder="E.g. https://images.unsplash.com/photo-..."
                    />
                  </div>


                </div>

                {profileSuccessMsg && (
                  <div className="text-[10px] font-bold text-center text-emerald-600 bg-emerald-50 rounded-lg p-1.5 border border-emerald-100">
                    {profileSuccessMsg}
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex-1 py-1.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-550 rounded-xl cursor-pointer focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs disabled:opacity-50 focus:outline-none"
                  >
                    {isSavingProfile ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>

              {/* System Logout Options at the very bottom */}
              <div className="border-t border-slate-100 pt-3.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100/90 text-rose-750 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 border border-rose-200/80 transition-colors cursor-pointer focus:outline-none"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Duty</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Sidebar Nav (Desktop Left: 240px wide) */}
        <aside className="w-60 bg-white border-r border-slate-200/80 shrink-0 hidden lg:block p-4 space-y-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto self-start">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pl-3 mb-2">SYSTEM MENU</p>
            {[
              { id: "overview", label: "Overview Metrics", icon: getTabLabelIcon("overview") },
              { id: "assignments", label: "Assignments & Tasks", icon: getTabLabelIcon("assignments") },
              { id: "map", label: "Interactive OSM Map", icon: getTabLabelIcon("map") },
              { id: "attendance", label: "Attendance Portal", icon: getTabLabelIcon("attendance") },
              { id: "payroll", label: "Salaries & Ledger", icon: getTabLabelIcon("payroll") },
              { id: "announcements", label: "Notices & Announcements", icon: getTabLabelIcon("announcements") },
              { id: "safety", label: "Safety & SOS Hub", icon: getTabLabelIcon("safety") },
              ...(currentUser?.role === "admin"
                ? [{ id: "workforce", label: "Admin Workspace", icon: getTabLabelIcon("workforce") }]
                : [])
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedWorkerMapFocus(undefined);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center space-x-3 transition-colors cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                      : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-150 pt-4 text-[10px] font-sans leading-relaxed text-slate-400 space-y-2 pl-3">
            <div className="flex items-center space-x-1 text-slate-500 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>GEOFENCED ONLINE</span>
            </div>
            <p>GPS feeds are verified against client geofence radius zones asynchronously. Face recognition simulation activated.</p>
          </div>
        </aside>

        {/* Mobile menu override block overlays */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/50 block lg:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="w-56 h-full bg-white border-r border-slate-205 p-4 flex flex-col justify-between overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-800 font-display">System Grid Menu</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs px-2 py-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { id: "overview", label: "Overview Metrics", icon: getTabLabelIcon("overview") },
                    { id: "assignments", label: "Assignments & Tasks", icon: getTabLabelIcon("assignments") },
                    { id: "map", label: "Interactive OSM Map", icon: getTabLabelIcon("map") },
                    { id: "attendance", label: "Attendance Portal", icon: getTabLabelIcon("attendance") },
                    { id: "payroll", label: "Salaries & Ledger", icon: getTabLabelIcon("payroll") },
                    { id: "announcements", label: "Notices & Announcements", icon: getTabLabelIcon("announcements") },
                    { id: "safety", label: "Safety & SOS Hub", icon: getTabLabelIcon("safety") },
                    ...(currentUser?.role === "admin"
                      ? [{ id: "workforce", label: "Admin Workspace", icon: getTabLabelIcon("workforce") }]
                      : [])
                  ].map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSelectedWorkerMapFocus(undefined);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-left flex items-center space-x-3 cursor-pointer ${
                          active ? "bg-indigo-600 text-white" : "text-slate-650 hover:bg-slate-100"
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-h-0 bg-slate-50/50 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Operations Room</h2>
                <p className="text-xs text-slate-505 text-slate-400 mt-0.5">Automated task allocation efficiency and safety overlays</p>
              </div>
              <DashboardStats
                users={users}
                attendance={attendance}
                tasks={tasks}
                onFocusWorker={handleFocusWorkerOnMap}
              />
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-6 animate-fade-in">
              <TaskBoard
                tasks={tasks}
                users={users}
                loggedInUser={currentUser}
                onAddTask={handleAddTaskSubmit}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            </div>
          )}

          {activeTab === "map" && (
            <div className="space-y-6 animate-fade-in h-140 lg:h-[650px]">
              <MapTracking
                gpsLogs={gpsLogs}
                tasks={tasks}
                selectedWorkerId={selectedWorkerMapFocus}
                onSimulateMove={handleSimulateTravelMove}
                isSimulating={isWorkerTravelingSim}
              />
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Time Card Verification Checkpoint</h2>
                <p className="text-xs text-slate-400 mt-0.5">Anti-fraud facial verification and geofenced coordinate stamps</p>
              </div>
              <AttendanceCard
                loggedInUser={currentUser!}
                attendanceRecords={attendance}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onUpdateAttendance={handleUpdateAttendance}
              />
            </div>
          )}

          {activeTab === "payroll" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Salaries & Ledger Center</h2>
                <p className="text-xs text-slate-400 mt-0.5">Wages, incentives, extra overtime compensation indices</p>
              </div>
              <PayrollSection
                payrollRecords={payroll}
                loggedInUser={currentUser}
                onUpdatePayroll={handleUpdatePayroll}
              />
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Notices & Announcements Board</h2>
                <p className="text-xs text-slate-400 mt-0.5">Notices and announcements platform, hazards, and employee broadcasts</p>
              </div>
              <CommunicationsPanel
                announcements={announcements}
                chats={chats}
                users={users}
                loggedInUser={currentUser}
                onAddAnnouncement={handleAddAnnouncement}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {activeTab === "safety" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Emergency Safety Hub</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time SOS broadcasting logs, biometric security radar & safety incident registrar</p>
              </div>
              <SafetySection
                loggedInUser={currentUser!}
                users={users}
                incidents={safetyIncidents}
                onAddIncident={handleAddIncident}
                sosAlerts={sosAlerts}
                onTriggerSOS={handleTriggerSOS}
                onResolveSOS={handleResolveSOS}
              />
            </div>
          )}

          {activeTab === "workforce" && currentUser?.role === "admin" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">System Administration Terminal</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live personnel management, credentials allocation & system policy tuning</p>
              </div>
              <AdminWorkspace
                users={users}
                loggedInUser={currentUser!}
                onUpdateUser={handleUpdateUser}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
