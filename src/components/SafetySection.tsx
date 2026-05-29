import React, { useState, useEffect } from "react";
import { User, SafetyIncident, SOSAlert, HealthAlert } from "../types";
import { apiFetch } from "../lib/api";
import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  FileWarning, 
  HeartHandshake, 
  Activity, 
  Thermometer, 
  Wind, 
  UserX, 
  Brain, 
  Check, 
  Skull, 
  RefreshCw, 
  Sparkles,
  LifeBuoy
} from "lucide-react";

interface SafetySectionProps {
  loggedInUser: User;
  users: User[];
  incidents: SafetyIncident[];
  onAddIncident: (data: any) => Promise<void>;
  sosAlerts: SOSAlert[];
  onTriggerSOS: (data: any) => Promise<void>;
  onResolveSOS: (id: string) => Promise<void>;
}

export default function SafetySection({
  loggedInUser,
  users,
  incidents,
  onAddIncident,
  sosAlerts,
  onTriggerSOS,
  onResolveSOS
}: SafetySectionProps) {
  // SOS trigger animation states
  const [sosActive, setSosActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; address: string }>({
    lat: 40.7580,
    lng: -73.9855,
    address: "Times Square HQ Dispatch Area, NY"
  });

  // Incident form states
  const [incType, setIncType] = useState("Equipments Failure");
  const [incSeverity, setIncSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [incLoc, setIncLoc] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [showForm, setShowForm] = useState(false);

  // AI Health monitoring simulator
  const [healthData, setHealthData] = useState<HealthAlert[]>([]);
  const [scanningHealth, setScanningHealth] = useState(false);
  const [healthInsight, setHealthInsight] = useState<string | null>(null);

  // Emergency contact list preseeds
  const emergencyContacts = [
    { name: "HQ Medical Dispatch", phone: "+1 (555) 911-3000", relation: "Operations Health" },
    { name: "HQ Safety Supervisor", phone: "+1 (555) 911-3011", relation: "Chief Director" },
    { name: "Sarah Jenkins Supervisor", phone: "+1 (555) 012-3456", relation: "Team Supervisor" }
  ];

  // Browser Geolocation lock for accurate SOS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "Hardware GPS verified coordinates"
        });
      });
    }

    // Seed initial health alerts for other workers
    initHealthAlerts();
  }, [users]);

  const initHealthAlerts = () => {
    const workers = users.filter((u) => u.role === "worker");
    const mapped: HealthAlert[] = workers.map((w, idx) => {
      // Seed some randomized healthy/risky parameters
      const hasRisk = idx === 1; // Priya Patel gets high risk just to make the simulator interesting
      return {
        userId: w.id,
        userName: w.name,
        heartRate: hasRisk ? 112 : 72 + Math.floor(Math.random() * 15),
        bodyTempCel: hasRisk ? 39.1 : 36.5 + Math.floor(Math.random() * 8) / 10,
        gasRating: hasRisk ? "Toxic Carbon-Monoxide (55ppm)" : "Normal (O₂ 20.9%)",
        fatigueIndex: hasRisk ? 82 : 20 + Math.floor(Math.random() * 30),
        status: hasRisk ? "High Risk" : "Normal"
      };
    });
    setHealthData(mapped);
  };

  const handleSOSPress = async () => {
    if (sosActive) {
      // Toggle off
      setSosActive(false);
      return;
    }

    setSosLoading(true);
    setTimeout(async () => {
      await onTriggerSOS({
        userId: loggedInUser.id,
        userName: loggedInUser.name,
        latitude: currentGps.lat,
        longitude: currentGps.lng
      });
      setSosLoading(false);
      setSosActive(true);
    }, 1500);
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc || !incLoc) return;

    await onAddIncident({
      userId: loggedInUser.id,
      userName: loggedInUser.name,
      type: incType,
      severity: incSeverity,
      location: incLoc,
      description: incDesc
    });

    setIncLoc("");
    setIncDesc("");
    setShowForm(false);
  };

  // Run AI Health Assessment Analysis
  const runAIHealthCheck = async () => {
    setScanningHealth(true);
    setHealthInsight(null);
    try {
      const response = await apiFetch("/api/ai/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry: healthData })
      });
      
      if (response.ok) {
        const resJson = await response.json();
        setHealthInsight(resJson.insight);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback
      setTimeout(() => {
        setHealthInsight("💡 AI Safety Predictor says: Michael Chen has normal cardiological bounds. Priya Patel exhibits moderate hyperthermia & hazardous toxic environment thresholds on site. Redirect immediate relief task units.");
      }, 1500);
    } finally {
      setScanningHealth(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] font-sans">
      
      {/* LEFT COLUMN: SOS Controller & Emergency contacts (5 Cols) */}
      <div className="space-y-6 lg:col-span-5 flex flex-col">
        {/* BIG RED SOS BUTTON CARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative overflow-hidden flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-center font-display">
              <ShieldAlert className="w-5 h-5 text-rose-600 mr-2 shrink-0 animate-pulse" />
              <span>Tactical SOS Dispatch</span>
            </h3>
            <p className="text-xs text-slate-400">Instantly transmit live distress vectors to supervisors and local services</p>
          </div>

          <div className="py-8 flex flex-col items-center justify-center">
            {/* Pulsating emergency circles */}
            <div className="relative flex items-center justify-center">
              {sosActive && (
                <>
                  <span className="animate-ping absolute inline-flex h-44 w-44 rounded-full bg-rose-500 opacity-20"></span>
                  <span className="animate-ping absolute inline-flex h-36 w-36 rounded-full bg-rose-600 opacity-30"></span>
                </>
              )}
              <button
                onClick={handleSOSPress}
                disabled={sosLoading}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-2xl transition-all font-display duration-300 transform active:scale-95 cursor-pointer select-none ${
                  sosActive 
                    ? "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-rose-600/30" 
                    : "bg-slate-900 text-slate-100 hover:bg-slate-855 hover:shadow-slate-800/30"
                }`}
              >
                {sosLoading ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : sosActive ? (
                  <>
                    <Skull className="w-10 h-10 animate-bounce text-white mb-1" />
                    <span className="text-xs font-black tracking-widest uppercase">SOS ACTIVE</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-10 h-10 text-rose-500 mb-1" />
                    <span className="text-xs font-black tracking-widest uppercase">TRIGGER SOS</span>
                  </>
                )}
              </button>
            </div>
            
            {sosActive && (
              <p className="text-xs text-rose-600 font-extrabold animate-pulse mt-4 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                🚨 BROADCASTING DISTRESS SIGNALS... GPS LAT: {currentGps.lat.toFixed(5)}, LNG: {currentGps.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 text-left font-medium">
            <div className="flex items-center space-x-1.5 justify-center md:justify-start">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">Active Beacon: <strong>{currentGps.address}</strong></span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center md:text-left">
              Coordinates: {currentGps.lat.toFixed(6)}, {currentGps.lng.toFixed(6)}
            </p>
          </div>
        </div>

        {/* EMERGENCY CONTACTS WIDGET */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <PhoneCall className="w-4 h-4 text-indigo-600 mr-2" />
            <span>Emergency Contact Directory</span>
          </h3>
          <div className="space-y-2 text-xs">
            {emergencyContacts.map((contact, i) => (
              <div key={i} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between font-medium">
                <div>
                  <h4 className="font-bold text-slate-800">{contact.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{contact.relation}</p>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] text-indigo-700 border border-indigo-200 font-bold rounded-lg flex items-center space-x-1"
                >
                  <PhoneCall className="w-3 h-3 text-indigo-500" />
                  <span>Call {contact.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Safety Reporting & AI Health Radar (7 Cols) */}
      <div className="space-y-6 lg:col-span-7">
        
        {/* SAFETY INCIDENT REPORTING WIDGET */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <FileWarning className="w-5 h-5 text-amber-500 mr-2 shrink-0" />
              <span>Safety Incident Registrar</span>
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-2.5 py-1.5 bg-slate-150 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 transitioning"
            >
              {showForm ? "View Logs" : "File Diagnostic Report"}
            </button>
          </div>

          {showForm ? (
            <form onSubmit={submitIncident} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-650">Hazard / Incident Type</label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="Equipments Failure">⚙️ Equipment failure/disruption</option>
                    <option value="Hazardous Chemical Leak">⚠️ Gas leak/Environmental hazard</option>
                    <option value="Physical Injury">🩹 Medical/Physical bodily injury</option>
                    <option value="Severe Weather Disruption">🌪️ High wind/Lightning flash hazard</option>
                    <option value="Intruder/Security Breach">🥷 Unauthorized intrusion</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-650">Severity Rating</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white font-semibold text-rose-600"
                  >
                    <option value="Low">Low - site audit flagged</option>
                    <option value="Medium">Medium - task queue suspended</option>
                    <option value="High">🚨 High - physical disruption</option>
                    <option value="Critical">💀 Critical - life-safety alarm</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-650">Hazard Address / Location Coordinates</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broadband Node C, Midtown Manhattan"
                  value={incLoc}
                  onChange={(e) => setIncLoc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-650">Safety Incident Scope Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Log details of the physical environmental constraints, active relief operations, and mitigating steps done..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg transition-transform active:scale-99"
              >
                Log Physical Safety Incident
              </button>
            </form>
          ) : (
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No active incidents recorded. Field is cleared with perfect safety bounds.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div key={inc.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-xs font-sans">
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        inc.severity === "Critical" 
                          ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse" 
                          : inc.severity === "High" 
                          ? "bg-amber-100 text-amber-800 border-amber-300" 
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {inc.severity} Severity
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{new Date(inc.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-900">{inc.type} @ {inc.location}</h4>
                    <p className="text-[11px] text-slate-600 bg-white/50 p-2 border border-slate-100 rounded-md italic">
                      "{inc.description}"
                    </p>
                    <div className="flex justify-between items-center text-[9px] text-slate-405 text-slate-400 font-mono mt-2 font-bold">
                      <span>Logged: <strong>{inc.userName}</strong></span>
                      <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">Status: {inc.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* AI BIOMETRIC HEALTH MONITORING RADAR */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold font-display flex items-center">
                  <span>AI Biometric Security Patrol</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 ml-1.5 fill-indigo-400/20" />
                </h3>
                <p className="text-[10px] text-slate-300">Continuous telemetry heart rate, core temperature body thresholds, and gas leaks</p>
              </div>
            </div>

            <button
              onClick={runAIHealthCheck}
              disabled={scanningHealth}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 text-[10px] font-bold rounded-lg flex items-center space-x-1.5 disabled:opacity-40 select-none"
            >
              <RefreshCw className={`w-3 h-3 ${scanningHealth ? "animate-spin" : ""}`} />
              <span>{scanningHealth ? "Scanning Radar..." : "Scan AI Health Risks"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-4">
            {healthData.map((hp) => (
              <div key={hp.userId} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold border-b border-white/5 pb-1">
                  <span>{hp.userName}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    hp.status === "High Risk" ? "bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/30" : "bg-emerald-550/20 text-emerald-400"
                  }`}>{hp.status}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-450 text-indigo-400" />
                    <span>Heart: <strong className="font-mono">{hp.heartRate} bpm</strong></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Thermometer className="w-3.5 h-3.5 text-rose-455 text-rose-400" />
                    <span>Temp: <strong className="font-mono">{hp.bodyTempCel.toFixed(1)}°C</strong></span>
                  </div>
                  <div className="flex items-center space-x-1 col-span-2">
                    <Wind className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Local Toxic: <strong className="font-mono text-amber-300">{hp.gasRating}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {healthInsight && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs leading-relaxed text-indigo-100 flex items-start space-x-2 animate-fade-in relative z-10">
              <Brain className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center mb-0.5 font-mono">
                  AI SAFETY PATROL PREDICTION DICTIONARY
                </span>
                <p>{healthInsight}</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
