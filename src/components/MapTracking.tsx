import { useEffect, useRef, useState } from "react";
import { GPSLog, Task } from "../types";
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw, Zap } from "lucide-react";

interface MapTrackingProps {
  gpsLogs: GPSLog[];
  tasks: Task[];
  selectedWorkerId?: string;
  onSimulateMove?: (workerId: string) => void;
  isSimulating: Record<string, boolean>;
}

export default function MapTracking({
  gpsLogs,
  tasks,
  selectedWorkerId,
  onSimulateMove,
  isSimulating
}: MapTrackingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const taskMarkersRef = useRef<Record<string, any>>({});
  const geofencesRef = useRef<any[]>([]);
  const pathRef = useRef<any>(null);
  
  const [activeWorkerFilter, setActiveWorkerFilter] = useState<string>("all");
  const [mapError, setMapError] = useState<string | null>(null);

  // Helper static assets to represent custom Leaflet pins without local path bundle issues
  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Working": return "#10b981"; // Emerald
      case "Traveling": return "#3b82f6"; // Blue
      case "On Break": return "#f59e0b"; // Yellow/Ambar
      default: return "#64748b"; // Slate/Offline
    }
  };

  useEffect(() => {
    // Graceful check for Leaflet availability
    const L = (window as any).L;
    if (!L) {
      setMapError("Map Asset Library (Leaflet) is still loading from CDN. Please verify connection.");
      return;
    }
    setMapError(null);

    if (!mapContainerRef.current) return;

    // 1. Initialize Map instance once
    if (!mapInstanceRef.current) {
      try {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: false, // Customized position
          attributionControl: true
        }).setView([40.7484, -73.9857], 13); // Midtown Manhattan default center

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          attribution: '© OpenStreetMap, © CartoDB'
        }).addTo(mapInstanceRef.current);

        L.control.zoom({ position: "bottomright" }).addTo(mapInstanceRef.current);
      } catch (e) {
        console.error("Map initialization failed:", e);
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 2. Clear old tasks and geofences
    geofencesRef.current.forEach((g) => map.removeLayer(g));
    geofencesRef.current = [];
    
    Object.values(taskMarkersRef.current).forEach((m) => map.removeLayer(m));
    taskMarkersRef.current = {};

    if (pathRef.current) {
      map.removeLayer(pathRef.current);
      pathRef.current = null;
    }

    // 3. Render Geofenced Tasks
    tasks.forEach((task) => {
      if (!task.location) return;
      const { lat, lng, address } = task.location;

      // Color based on status
      const color = task.status === "Completed" ? "#10b981" : task.priority === "High" ? "#ef4444" : "#6366f1";

      // Geofence Circle (150-meter safety target check)
      const circle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        radius: 150 // standard checkout geofence limit meters
      }).addTo(map);
      
      geofencesRef.current.push(circle);

      // Create Custom SVG Map pin
      const taskIcon = L.divIcon({
        className: "custom-task-icon",
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg animate-pulse" style="background-color: ${color}">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const cardHtml = `
        <div class="p-2 font-sans">
          <div class="flex items-center space-x-1.5 mb-1">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${
              task.priority === "High" ? "bg-red-100 text-red-800" : "bg-indigo-100 text-indigo-800"
            }">${task.priority} Priority</span>
            <span class="text-[10px] font-medium bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">${task.category}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900">${task.title}</h4>
          <p class="text-[11px] text-slate-500 my-1">${address}</p>
          <div class="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1.5 mt-1 text-slate-400">
            <span>Assignee: <strong>${task.assignedToName}</strong></span>
            <span class="font-semibold text-slate-700">${task.status}</span>
          </div>
        </div>
      `;

      const taskMarker = L.marker([lat, lng], { icon: taskIcon })
        .addTo(map)
        .bindPopup(cardHtml);
      
      taskMarkersRef.current[task.id] = taskMarker;
    });

    // 4. Update or Render Worker Markers
    const visibleLogs = activeWorkerFilter === "all"
      ? gpsLogs
      : gpsLogs.filter((g) => g.userId === activeWorkerFilter);

    // Filter out old markers
    const logUserIds = visibleLogs.map((g) => g.userId);
    Object.keys(markersRef.current).forEach((userId) => {
      if (!logUserIds.includes(userId)) {
        map.removeLayer(markersRef.current[userId]);
        delete markersRef.current[userId];
      }
    });

    visibleLogs.forEach((log) => {
      const { userId, userName, latitude, longitude, status, batteryLevel } = log;
      const color = getMarkerColor(status);

      const workerIcon = L.divIcon({
        className: "custom-worker-icon",
        html: `
          <div class="relative group">
            <div class="w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center bg-slate-900 overflow-hidden relative" style="border-color: ${color}">
              <img src="https://images.unsplash.com/photo-${
                userId === "u-worker1" ? "1507003211169-0a1dd7228f2d" :
                userId === "u-worker2" ? "1500648767791-00dcc994a43e" :
                userId === "u-worker3" ? "1438761681033-6461ffad8d80" : "1544005313-94ddf0286df2"
              }?auto=format&fit=crop&q=80&w=80" class="w-full h-full object-cover" />
              
              <!-- Battery Indicator pill -->
              <span class="absolute bottom-0 right-1 text-[8px] font-bold text-white px-0.5 rounded-full ${
                batteryLevel && batteryLevel < 25 ? "bg-red-500 animate-pulse" : "bg-emerald-500"
              }">${batteryLevel || 100}%</span>
            </div>
            <!-- Status Ripple anchor -->
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${color}"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5" style="background-color: ${color}"></span>
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const popupHtml = `
        <div class="p-2 font-sans w-48">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-1.5 mb-1.5">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
              <img src="https://images.unsplash.com/photo-${
                userId === "u-worker1" ? "1507003211169-0a1dd7228f2d" :
                userId === "u-worker2" ? "1500648767791-00dcc994a43e" :
                userId === "u-worker3" ? "1438761681033-6461ffad8d80" : "1544005313-94ddf0286df2"
              }?auto=format&fit=crop&q=80&w=120" class="w-full h-full object-cover" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900">${userName}</h4>
              <p class="text-[10px] text-slate-400 font-mono">ID: ${userId === "u-worker1" ? "EMP-101" : userId === "u-worker2" ? "EMP-102" : userId === "u-worker3" ? "EMP-103" : "EMP-104"}</p>
            </div>
          </div>
          <div class="space-y-1 text-[11px] text-slate-600">
            <p class="flex items-center"><span class="w-12 text-slate-400">Status:</span><strong class="px-1 py-0.5 rounded text-[10px] bg-sky-50" style="color: ${color}">${status}</strong></p>
            <p class="flex items-center"><span class="w-12 text-slate-400">Position:</span><span class="font-mono">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span></p>
            <p class="flex items-center"><span class="w-12 text-slate-400">Battery:</span><span>${batteryLevel || 100}%</span></p>
          </div>
        </div>
      `;

      if (markersRef.current[userId]) {
        // Move existing smoothly
        markersRef.current[userId].setLatLng([latitude, longitude]);
        markersRef.current[userId].setPopupContent(popupHtml);
      } else {
        // Create new
        const marker = L.marker([latitude, longitude], { icon: workerIcon })
          .addTo(map)
          .bindPopup(popupHtml);
        markersRef.current[userId] = marker;
      }
    });

    // 5. Automatic focus and dynamic path plotting if a specific worker is selected
    const activeTargetId = selectedWorkerId || (activeWorkerFilter !== "all" ? activeWorkerFilter : null);
    if (activeTargetId) {
      const activeLog = gpsLogs.find((g) => g.userId === activeTargetId);
      if (activeLog) {
        map.setView([activeLog.latitude, activeLog.longitude], 14, { animate: true });
        
        // Find assigned tasks for this worker to plot an optimized navigation route
        const activeTasks = tasks.filter((t) => t.assignedToId === activeTargetId && t.status !== "Completed");
        if (activeTasks.length > 0 && activeTasks[0].location) {
          const taskLoc = activeTasks[0].location;
          // Render optimized path line
          const coordinates = [
            [activeLog.latitude, activeLog.longitude],
            [taskLoc.lat, taskLoc.lng]
          ];
          
          pathRef.current = L.polyline(coordinates, {
            color: "#6366f1",
            weight: 4,
            opacity: 0.65,
            dashArray: "10, 10"
          }).addTo(map);
          
          // Fit map boundaries to contain both nodes nicely
          map.fitBounds(pathRef.current.getBounds(), { padding: [40, 40] });
        }
      }
    } else if (visibleLogs.length > 0) {
      // Default to fit all workers
      const coords = visibleLogs.map((g) => [g.latitude, g.longitude]);
      if (coords.length > 1) {
        map.fitBounds(coords, { padding: [50, 50] });
      } else if (coords.length === 1) {
        map.setView(coords[0], 13);
      }
    }

  }, [gpsLogs, tasks, selectedWorkerId, activeWorkerFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm h-full flex flex-col min-h-[500px]">
      {/* Top Map Action bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Compass className="w-5 h-5 animate-spin-slow text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 font-display">Live Tracking Radar</h3>
            <p className="text-xs text-slate-400">Interactive OpenStreetMap (OSM) field coordinates overlay</p>
          </div>
        </div>

        {/* Worker Focus Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-medium text-slate-400 font-mono">RADAR LOCK:</label>
          <select
            value={activeWorkerFilter}
            onChange={(e) => setActiveWorkerFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
          >
            <option value="all">🛰️ All Workers On Duty</option>
            {gpsLogs.map((log) => (
              <option key={log.userId} value={log.userId}>
                👤 {log.userName} ({log.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col lg:flex-row min-h-0">
        {/* Left Side: Worker mini lists with quick simulator triggers */}
        <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-4 flex flex-col overflow-y-auto shrink-0 max-h-[300px] lg:max-h-none">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 font-mono">
            <span>DUTY OPERATIONS:</span>
            <span>{gpsLogs.length} ACTIVE</span>
          </div>
          <div className="space-y-1.5">
            {gpsLogs.map((log) => {
              const color = getMarkerColor(log.status);
              const isWWorkerSimulating = isSimulating[log.userId];
              const isCurrentFocused = activeWorkerFilter === log.userId || selectedWorkerId === log.userId;

              return (
                <div
                  key={log.id}
                  onClick={() => setActiveWorkerFilter(log.userId)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                    isCurrentFocused
                      ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/10"
                      : "bg-slate-100 hover:bg-white border-slate-200/60"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{log.userName}</span>
                    <span
                      className="w-2 h-2 rounded-full self-center shrink-0 blur-[0.5px]"
                      style={{ backgroundColor: color }}
                    ></span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">{log.status}</span>
                    <span>🔋 {log.batteryLevel}%</span>
                  </div>

                  {onSimulateMove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSimulateMove(log.userId);
                      }}
                      className={`w-full py-1 px-2 rounded-md font-semibold text-[10px] flex items-center justify-center space-x-1.5 transition-all ${
                        isWWorkerSimulating
                          ? "bg-amber-100 text-amber-700 font-bold animate-pulse"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${isWWorkerSimulating ? "animate-bounce" : ""}`} />
                      <span>{isWWorkerSimulating ? "Emulating Drive..." : "Trigger Live Travel"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-auto pt-4 text-[10px] text-slate-400 space-y-1">
            <h5 className="font-bold font-mono text-slate-600">MAP LEGEND:</h5>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMarkerColor("Working") }}></span>
              <span>Green: Working On Site</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMarkerColor("Traveling") }}></span>
              <span>Blue: Emulating Route Transit</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMarkerColor("On Break") }}></span>
              <span>Yellow: Employee On Rest</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMarkerColor("Offline") }}></span>
              <span>Gray: Static/Duty Complete</span>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative min-h-[400px]">
          {mapError ? (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6 text-center">
              <div className="max-w-md bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-800">Coordinate Radar Interrupted</h4>
                <p className="text-xs text-slate-500 mt-2">{mapError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Session Map</span>
                </button>
              </div>
            </div>
          ) : null}
          <div ref={mapContainerRef} className="absolute inset-0 z-10" />
        </div>
      </div>
    </div>
  );
}
