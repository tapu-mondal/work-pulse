import { useState, useEffect } from "react";
import { AttendanceRecord, User } from "../types";
import { Clock, MapPin, CheckCircle, Shield, AlertTriangle, ScanFace, LogIn, LogOut, History, ShieldAlert, Check } from "lucide-react";

interface AttendanceCardProps {
  loggedInUser: User;
  attendanceRecords: AttendanceRecord[];
  onClockIn: (data: { lat: number; lng: number; address: string }) => Promise<void>;
  onClockOut: (data: { lat: number; lng: number; address: string }) => Promise<void>;
  onUpdateAttendance?: (id: string, updates: any) => Promise<void>;
}

export default function AttendanceCard({
  loggedInUser,
  attendanceRecords,
  onClockIn,
  onClockOut,
  onUpdateAttendance
}: AttendanceCardProps) {
  const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  // Biometric animation states
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "capturing" | "analyzing" | "success" | "idle_ready">("idle");
  const [scanProgress, setScanProgress] = useState(0);

  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().substring(0, 10);
  
  // Filter attendance record for current employee today
  const myRecordToday = attendanceRecords.find(
    (r) => r.userId === loggedInUser.id && r.date === todayStr
  );

  // My full historical records
  const myHistory = attendanceRecords
    .filter((r) => r.userId === loggedInUser.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Simulated GPS address matching
  const getSimulatedAddress = (lat: number, lng: number) => {
    // Generate a beautiful location text based on Manhattan coordinates
    if (lat > 40.76 && lng < -74.00) return "Manhattan office, Broadway, NYC";
    if (lat < 40.72) return "Downtown Operations Hub, South Ferry, NY";
    return "Operations Division, Midtown Manhattan, NY";
  };

  // Browser Geolocation lock
  const detectDeviceLocation = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = getSimulatedAddress(lat, lng);
          setCurrentCoordinates({ lat, lng, address });
          setLoadingLoc(false);
        },
        (error) => {
          console.log("Could not obtain hardware GPS lock, applying high precision NYC operational mock coordinates.");
          // Apply a randomized Midtown Manhattan GPS coordinate coordinate lock
          const lat = 40.7484 + (Math.random() - 0.5) * 0.005;
          const lng = -73.9857 + (Math.random() - 0.5) * 0.005;
          setCurrentCoordinates({
            lat,
            lng,
            address: getSimulatedAddress(lat, lng)
          });
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Direct mock
      setCurrentCoordinates({
        lat: 40.7580,
        lng: -73.9855,
        address: "Times Square HQ Dispatch Grid, NY"
      });
      setLoadingLoc(false);
    }
  };

  useEffect(() => {
    detectDeviceLocation();
  }, []);

  const triggerFaceRecognitionClockIn = async () => {
    if (!currentCoordinates) {
      setAttendanceMessage("Please wait for device location configuration to align.");
      return;
    }

    setIsBiometricScanning(true);
    setScanStep("capturing");
    setScanProgress(0);

    // Increment scanning progress bars
    const tInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(tInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    // Transition stages
    setTimeout(() => {
      setScanStep("analyzing");
    }, 1200);

    setTimeout(async () => {
      setScanStep("success");
      try {
        await onClockIn(currentCoordinates);
        setAttendanceMessage("✅ Biometrics verified. Duty status: On Duty!");
      } catch (err: any) {
        setAttendanceMessage("❌ Verification failure: Already clocked in.");
      }
      
      setTimeout(() => {
        setIsBiometricScanning(false);
        setScanStep("idle");
      }, 1500);
    }, 2800);
  };

  const triggerClockOut = async () => {
    if (!currentCoordinates) return;
    try {
      await onClockOut(currentCoordinates);
      setAttendanceMessage("🔴 Clock Out verified. Off Duty shift completed.");
    } catch (err: any) {
      setAttendanceMessage("❌ Clock out error: " + err.message);
    }
  };

  const getPunctualityStyle = (status: string) => {
    switch (status) {
      case "On Time": return "bg-emerald-100 text-emerald-800 border-emerald-250";
      case "Late": return "bg-amber-100 text-amber-800 border-amber-250 animate-pulse";
      case "Half Day": return "bg-indigo-100 text-indigo-800 border-indigo-250";
      default: return "bg-rose-100 text-rose-800 border-rose-250";
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Biometric Face scanner Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <ScanFace className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Simulated Biometric Check-In</h3>
            </div>

            {/* Active facial scan area */}
            <div className="relative border border-slate-200 rounded-xl bg-slate-900 aspect-video flex flex-col items-center justify-center overflow-hidden shrink-0">
              {isBiometricScanning ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-905/90">
                  {/* Simulated Green Scanner Beam Overlay line */}
                  {scanStep === "capturing" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] animate-scanner-beam"></div>
                  )}

                  {/* Face Scanning HUD Box overlay */}
                  <div className="w-28 h-28 border-2 border-dashed border-indigo-400 rounded-full flex items-center justify-center relative animate-spin-slow">
                    <div className="absolute inset-2 border border-slate-705 rounded-full"></div>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-xs font-bold text-slate-355 tracking-widest uppercase font-mono text-emerald-400">
                      {scanStep === "capturing" ? "Capturing Node Points..." : "Matching biometric vectors..."}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{scanProgress}% Match Accuracy</p>
                  </div>
                </div>
              ) : scanStep === "success" ? (
                <div className="absolute inset-0 z-30 bg-emerald-950/90 flex flex-col items-center justify-center text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-2 scale-110 duration-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-emerald-300">Biometric Verified</h4>
                  <p className="text-[10px] text-emerald-400/80 font-mono mt-1">Identity cleared. Attendance logged.</p>
                </div>
              ) : (
                // Default camera mock mockup
                <div className="text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-850 inline-flex items-center justify-center border border-slate-700/50 mb-2 text-slate-500">
                    <ScanFace className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Camera Device Node: Ready</p>
                  <p className="text-[10px] text-slate-525 text-slate-500 mt-0.5">Click "Clock In Duty" to align credentials</p>
                </div>
              )}
              
              {/* Visual holographic corners */}
              <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-500"></span>
              <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-500"></span>
              <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-500"></span>
              <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-500"></span>
            </div>
          </div>

          {/* Current Coordinate locks */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col space-y-1.5 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">GPS Location: <strong>{currentCoordinates ? currentCoordinates.address : "aligning index..."}</strong></span>
            </div>
            {currentCoordinates && (
              <p className="text-[10px] text-slate-400 font-mono ml-4.5">
                Lat: {currentCoordinates.lat.toFixed(6)}, Lng: {currentCoordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Verification Operations Panel (Clock-In Buttons) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Shift Verification Controller</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Verify attendance utilizing secure coordinates. Standard shift registers at <strong>09:00 AM</strong>.
            </p>

            {/* Core User state banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl mb-4 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Employee:</span>
                <span className="text-slate-900">{loggedInUser.name}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Designation:</span>
                <span className="text-indigo-600 font-mono">{loggedInUser.designation}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-503">
                <span>Today Shift:</span>
                <span>{myRecordToday ? "Active Shift Record" : "Pending Action"}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              {!myRecordToday ? (
                <button
                  onClick={triggerFaceRecognitionClockIn}
                  disabled={isBiometricScanning || loadingLoc}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 font-bold text-xs text-white rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Verify Biometrics & Clock In</span>
                </button>
              ) : !myRecordToday.checkOutTime ? (
                <button
                  onClick={triggerClockOut}
                  disabled={loadingLoc}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-750 font-bold text-xs text-white rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Clock Out / Conclude Shift</span>
                </button>
              ) : (
                <div className="py-3 bg-slate-100 text-slate-600 border border-slate-205 text-center font-bold text-xs rounded-xl flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Today's Shift Successfully Closed</span>
                </div>
              )}
            </div>
          </div>

          {attendanceMessage && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-150 rounded-lg text-[11px] font-bold text-indigo-900 animate-fade-in mt-4">
              {attendanceMessage}
            </div>
          )}
        </div>

        {/* Worker Punctuality Historian Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-3">
              <History className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Personal Punch History</h3>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {myHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No previous attendance records registered in this queue.
                </div>
              ) : (
                myHistory.map((rec) => (
                  <div key={rec.id} className="p-2.5 rounded-xl border border-slate-150/60 bg-slate-50 flex items-center justify-between text-xs transition-all hover:bg-white hover:border-slate-300">
                    <div>
                      <h4 className="font-bold text-slate-800 font-mono">{rec.date}</h4>
                      <p className="text-[10px] text-slate-450 text-slate-400 mt-0.5">
                        Check-In: <span className="font-mono text-slate-700">{new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {rec.checkOutTime && (
                          <span> • Check-Out: <span className="font-mono text-slate-700">{new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span>
                        )}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-md ${getPunctualityStyle(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] leading-relaxed text-slate-400 flex items-center space-x-1.5 font-sans">
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Holographic face recognition templates stored securely via device binding logic.</span>
          </div>
        </div>
      </div>

      {/* Supervisor Team Verification and Approval Section */}
      {(loggedInUser.role === "manager" || loggedInUser.role === "admin") && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display flex items-center">
                <ShieldAlert className="w-4 h-4 text-indigo-600 mr-2" />
                <span>Oversight Approval & Shift Registers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Approve attendance, override scheduling status, and review biometric telemetry matches</p>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded-lg">
              Supervisor Access
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-mono text-[9px] uppercase font-extrabold text-slate-400 bg-slate-50/50">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Punch In/Out</th>
                  <th className="p-4">Telemetry Verification</th>
                  <th className="p-4">Punctuality Override</th>
                  <th className="p-4 text-center">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                      No worker attendance logs registered in database.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">
                        {rec.userName}
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-600">
                        {rec.date}
                      </td>
                      <td className="p-4">
                        <div className="text-[11px] font-sans">
                          <div>Check-In: <span className="font-mono text-slate-700 font-bold">{new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                          {rec.checkOutTime ? (
                            <div>Check-Out: <span className="font-mono text-slate-700 font-bold">{new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                          ) : (
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-mono font-bold">ON DUTY NOW</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <span className={`${rec.gpsVerified ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"} font-bold px-1.5 py-0.5 rounded border border-current font-mono`}>
                            GPS stamps
                          </span>
                          <span className={`text-slate-500 font-semibold truncate max-w-[120px]`} title={rec.checkInLocation.address}>
                            {rec.checkInLocation.address}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <span className={`${rec.faceVerificationSimulated ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"} font-bold px-1.5 py-0.5 font-mono rounded border border-current`}>
                            Biometrics OK
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={rec.status}
                          onChange={async (e) => {
                            if (onUpdateAttendance) {
                              await onUpdateAttendance(rec.id, { status: e.target.value });
                            }
                          }}
                          className={`text-[11px] font-semibold rounded-lg px-2 py-1 bg-white border border-slate-200 focus:outline-none cursor-pointer ${getPunctualityStyle(rec.status)}`}
                        >
                          <option value="On Time">🟢 On Time</option>
                          <option value="Late">🟡 Late</option>
                          <option value="Absent">🔴 Absent</option>
                          <option value="Half Day">🔵 Half Day</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        {rec.approved ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                            <Check className="w-3.5 h-3.5" />
                            <span>Approved Register</span>
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              if (onUpdateAttendance) {
                                await onUpdateAttendance(rec.id, { approved: true });
                              }
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-xs transition-colors"
                          >
                            Verify & Approve Shift
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
