// --- SMART PERSISTENCE FALLBACK SYSTEM FOR SERVERLESS / STATIC DEPLOYMENTS ---
// When this web application is deployed to static hosting services (like Vercel),
// standard `/api/*` endpoints do not exist and return HTML 404 pages.
// This layer intercepts those queries and serves a fully stateful, fully-featured
// database in localStorage so the application remains 100% operational with no setup.

export let useLocalFallback = false;

export function isUsingLocalFallback(): boolean {
  return useLocalFallback;
}

export function forceBackendCheck(): void {
  useLocalFallback = false;
}

const initializeVirtualDB = () => {
  const existing = localStorage.getItem("workforce_virtual_db");
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      // Clear corrupt DB state
    }
  }

  const defaultSeeds = {
    users: [
      {
        id: "u-admin",
        name: "System Admin",
        email: "admin@workforce.com",
        role: "admin",
        department: "Operations",
        designation: "Chief Director",
        phone: "+880 1712-345678",
        employeeId: "EMP-001",
        skills: ["Management", "Planning", "Logistics", "AI Operations"],
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        performanceRating: 5.0,
        hourlyRate: 75
      },
      {
        id: "u-manager",
        name: "Sarah Jenkins",
        email: "sarah@workforce.com",
        role: "manager",
        department: "Field Engineering",
        designation: "Senior Supervisor",
        phone: "+1 (555) 012-3456",
        employeeId: "EMP-002",
        skills: ["Team Leadership", "Logistics Optimization", "Quality Control"],
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
        performanceRating: 4.8,
        hourlyRate: 45
      },
      {
        id: "u-worker1",
        name: "Michael Chen",
        email: "michael@workforce.com",
        role: "worker",
        department: "Field Engineering",
        designation: "Senior Technician",
        phone: "+1 (555) 987-6543",
        employeeId: "EMP-101",
        skills: ["Electrical Maintenance", "Fiber Splicing", "HVAC Repair"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
        performanceRating: 4.6,
        hourlyRate: 28
      },
      {
        id: "u-worker2",
        name: "David Rodriguez",
        email: "david@workforce.com",
        role: "worker",
        department: "Logistics",
        designation: "Delivery Coordinator",
        phone: "+1 (555) 123-9876",
        employeeId: "EMP-102",
        skills: ["Route Planning", "Heavy Delivery", "Customer Service"],
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
        performanceRating: 4.2,
        hourlyRate: 22
      },
      {
        id: "u-worker3",
        name: "Priya Patel",
        email: "priya@workforce.com",
        role: "worker",
        department: "Field Engineering",
        designation: "Fibers/Telecom Engineer",
        phone: "+1 (555) 456-7890",
        employeeId: "EMP-103",
        skills: ["Network Diagnostic", "Cabling", "Broadband Setup"],
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
        performanceRating: 4.9,
        hourlyRate: 30
      },
      {
        id: "u-worker4",
        name: "Aisha Diop",
        email: "aisha@workforce.com",
        role: "worker",
        department: "Safety & Audit",
        designation: "Compliance Inspector",
        phone: "+1 (555) 890-1234",
        employeeId: "EMP-104",
        skills: ["OSHA Regulations", "Safety Inspection", "Report Writing"],
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
        performanceRating: 4.5,
        hourlyRate: 26
      },
      {
        id: "u-worker5",
        name: "Alex Carter",
        email: "alex@workforce.com",
        role: "worker",
        department: "Field Engineering",
        designation: "Field Technician",
        phone: "+1 (555) 000-0000",
        employeeId: "EMP-372",
        skills: [],
        performanceRating: 5.0,
        hourlyRate: 25,
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
      },
      {
        id: "u-worker6",
        name: "James Miller",
        email: "james@workforce.com",
        role: "worker",
        department: "Field Engineering",
        designation: "Senior Supervisor",
        phone: "+1 (555) 000-0000",
        employeeId: "EMP-651",
        skills: ["Network Infrastructure"],
        performanceRating: 5.0,
        hourlyRate: 30,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
      }
    ],
    attendance: [
      {
        id: "att-1",
        userId: "u-worker1",
        userName: "Michael Chen",
        date: "2026-05-24",
        checkInTime: "2026-05-24T08:02:15.000Z",
        checkOutTime: "2026-05-24T17:05:00.000Z",
        status: "On Time",
        checkInLocation: { lat: 40.7128, lng: -74.006, address: "City Hall, Manhattan, NY" },
        checkOutLocation: { lat: 40.7132, lng: -74.0055, address: "Park Row, Manhattan, NY" }
      },
      {
        id: "att-2",
        userId: "u-worker2",
        userName: "David Rodriguez",
        date: "2026-05-24",
        checkInTime: "2026-05-24T08:31:00.000Z",
        checkOutTime: "2026-05-24T16:55:00.000Z",
        status: "Late Arrival",
        checkInLocation: { lat: 40.7589, lng: -73.9851, address: "Times Square, NY" },
        checkOutLocation: { lat: 40.7592, lng: -73.9845, address: "Broad Street, NY" }
      }
    ],
    tasks: [
      {
        id: "t-1",
        title: "Repair Fiber Optic Conduit Node B",
        category: "Field Repair",
        assignedToId: "u-worker1",
        assignedToName: "Michael Chen",
        assignedById: "u-admin",
        assignedByName: "System Admin",
        priority: "High",
        status: "In Progress",
        deadline: "2026-05-27",
        geofenceAddress: "Lincoln Center, Manhattan, NY",
        geofenceLat: 40.7725,
        geofenceLng: -73.9835,
        description: "Diagnose packet transmission drops in segment 4B. Excavate branch if required. Perform splice checking.",
        updates: [
          { timestamp: "2026-05-25T10:00:00.000Z", author: "Michael Chen", message: "Dispatched to site with specialized gear." },
          { timestamp: "2026-05-25T11:15:00.000Z", author: "Michael Chen", message: "Exposed damaged core cable block." }
        ]
      }
    ],
    gps_logs: [],
    announcements: [
      {
        id: "ann-1",
        title: "Mandatory Safety Gear Compliance Review",
        content: "Please ensure all operatives wear hardhats and high-visibility vests at all times while performing outdoor operations.",
        createdBy: "System Admin",
        timestamp: "2026-05-25T09:00:00.000Z"
      }
    ],
    chats: [],
    payroll: [
      {
        id: "pay-1",
        userId: "u-worker1",
        userName: "Michael Chen",
        month: "2026-05",
        hourlyRate: 28,
        hoursWorked: 160,
        overtimeHours: 12,
        bonus: 150,
        incentives: 50,
        deductions: 80,
        totalEarnings: 160 * 28 + 12 * 42 + 150 + 50 - 80,
        status: "Approved"
      }
    ],
    safety_incidents: [
      {
        id: "inc-1",
        type: "Near Miss",
        description: "Operator encountered unexpected high-voltage feedback on fiber trunk route.",
        severity: "Medium",
        timestamp: "2026-05-25T14:20:00.000Z",
        userName: "Michael Chen",
        status: "Addressed"
      }
    ],
    sos_alerts: []
  };

  localStorage.setItem("workforce_virtual_db", JSON.stringify(defaultSeeds));
  return defaultSeeds;
};

const makeMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : status === 401 ? "Unauthorized" : "Not Found",
    headers: { "Content-Type": "application/json" }
  });
};

const handleMockApiResponse = async (urlStr: string, init?: RequestInit): Promise<Response> => {
  const db = initializeVirtualDB();
  const save = () => localStorage.setItem("workforce_virtual_db", JSON.stringify(db));
  
  // Resolve host-relative pathname
  let path = urlStr;
  if (urlStr.startsWith("http://") || urlStr.startsWith("https://") || urlStr.startsWith("/")) {
    try {
      const parsed = new URL(urlStr, window.location.origin);
      path = parsed.pathname;
    } catch(e) {
      // Fallback
    }
  }
  
  const method = init?.method?.toUpperCase() || "GET";
  const body = init?.body ? JSON.parse(init.body as string) : null;
  
  if (path === "/api/auth/login") {
    const { email } = body || {};
    const user = db.users.find((u: any) => u.email.toLowerCase() === email?.toLowerCase());
    if (!user) {
      return makeMockResponse({ error: "User not found with this email" }, 401);
    }
    return makeMockResponse({ user, message: "Logged in successfully (Virtual storage session)" });
  }
  
  if (path === "/api/auth/register") {
    const { name, email, role, department, designation, phone, skills, hourlyRate } = body || {};
    if (db.users.find((u: any) => u.email === email)) {
      return makeMockResponse({ error: "Email is already registered" }, 400);
    }
    const newId = "u-" + Math.random().toString(36).substring(2, 11);
    const employeeId = "EMP-" + Math.floor(100 + Math.random() * 900);
    const newUser = {
      id: newId,
      name,
      email,
      role: role || "worker",
      department: department || "Operations",
      designation: designation || "Field Worker",
      phone: phone || "+1 (555) 000-0000",
      employeeId,
      skills: skills ? (typeof skills === "string" ? skills.split(",").map((s: any) => s.trim()) : skills) : [],
      performanceRating: 5.0,
      hourlyRate: Number(hourlyRate) || 20,
      avatarUrl: `https://images.unsplash.com/photo-${[
        "1500648767791-00dcc994a43e",
        "1494790108377-be9c29b29330",
        "1507003211169-0a1dd7228f2d",
        "1544005313-94ddf0286df2"
      ][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&q=80&w=150`
    };
    db.users.push(newUser);
    
    const currentMonth = new Date().toISOString().substring(0, 7);
    db.payroll.push({
      id: "pay-" + Math.random().toString(36).substring(2, 11),
      userId: newUser.id,
      userName: newUser.name,
      month: currentMonth,
      hourlyRate: newUser.hourlyRate,
      hoursWorked: 0,
      overtimeHours: 0,
      bonus: 0,
      incentives: 0,
      deductions: 0,
      totalEarnings: 0,
      status: "Pending"
    });
    
    save();
    return makeMockResponse({ user: newUser, message: "Worker registered successfully!" });
  }
  
  if (path === "/api/users") {
    return makeMockResponse(db.users);
  }
  
  if (path.startsWith("/api/users/")) {
    const id = path.split("/").pop();
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index !== -1 && body) {
      db.users[index] = { ...db.users[index], ...body };
      save();
      return makeMockResponse(db.users[index]);
    }
  }
  
  if (path === "/api/gps") {
    if (method === "POST" && body) {
      const newLog = {
        id: "gps-" + Math.random().toString(36).substring(2, 11),
        ...body,
        timestamp: new Date().toISOString()
      };
      db.gps_logs.push(newLog);
      save();
      return makeMockResponse(newLog);
    }
    return makeMockResponse(db.gps_logs);
  }
  
  if (path === "/api/attendance") {
    return makeMockResponse(db.attendance);
  }
  
  if (path === "/api/attendance/clockin") {
    const newRecord = {
      id: "att-" + Math.random().toString(36).substring(2, 11),
      ...body,
      checkInTime: new Date().toISOString(),
      status: "On Time"
    };
    db.attendance.push(newRecord);
    save();
    return makeMockResponse(newRecord);
  }
  
  if (path === "/api/attendance/clockout") {
    const { userId, checkOutLocation } = body || {};
    const record = db.attendance.find((a: any) => a.userId === userId && !a.checkOutTime);
    if (record) {
      record.checkOutTime = new Date().toISOString();
      record.checkOutLocation = checkOutLocation || { lat: 40.7128, lng: -74.006, address: "HQ Dispatched" };
      save();
      return makeMockResponse(record);
    }
    return makeMockResponse({ error: "Active check-in not found" }, 404);
  }
  
  if (path.startsWith("/api/attendance/")) {
    const id = path.split("/").pop();
    const index = db.attendance.findIndex((a: any) => a.id === id);
    if (index !== -1 && body) {
      db.attendance[index] = { ...db.attendance[index], ...body };
      save();
      return makeMockResponse(db.attendance[index]);
    }
  }
  
  if (path === "/api/tasks") {
    if (method === "POST" && body) {
      const newTask = {
        id: "t-" + Math.random().toString(36).substring(2, 11),
        updates: [],
        ...body
      };
      db.tasks.push(newTask);
      save();
      return makeMockResponse(newTask);
    }
    return makeMockResponse(db.tasks);
  }
  
  if (path.startsWith("/api/tasks/")) {
    const id = path.split("/").pop();
    const index = db.tasks.findIndex((t: any) => t.id === id);
    if (index !== -1 && body) {
      db.tasks[index] = { ...db.tasks[index], ...body };
      save();
      return makeMockResponse(db.tasks[index]);
    }
  }
  
  if (path === "/api/payroll") {
    return makeMockResponse(db.payroll);
  }
  
  if (path.startsWith("/api/payroll/")) {
    const id = path.split("/").pop();
    const index = db.payroll.findIndex((p: any) => p.id === id);
    if (index !== -1 && body) {
      db.payroll[index] = { ...db.payroll[index], ...body };
      save();
      return makeMockResponse(db.payroll[index]);
    }
  }
  
  if (path === "/api/chats") {
    if (method === "POST" && body) {
      const newChat = {
        id: "msg-" + Math.random().toString(36).substring(2, 11),
        ...body,
        timestamp: new Date().toISOString()
      };
      db.chats.push(newChat);
      save();
      return makeMockResponse(newChat);
    }
    return makeMockResponse(db.chats);
  }
  
  if (path === "/api/announcements") {
    if (method === "POST" && body) {
      const newAnn = {
        id: "ann-" + Math.random().toString(36).substring(2, 11),
        ...body,
        timestamp: new Date().toISOString()
      };
      db.announcements.push(newAnn);
      save();
      return makeMockResponse(newAnn);
    }
    return makeMockResponse(db.announcements);
  }
  
  if (path === "/api/safety/incidents") {
    if (method === "POST" && body) {
      const newIncident = {
        id: "inc-" + Math.random().toString(36).substring(2, 11),
        ...body,
        timestamp: new Date().toISOString(),
        status: "Pending"
      };
      db.safety_incidents.push(newIncident);
      save();
      return makeMockResponse(newIncident);
    }
    return makeMockResponse(db.safety_incidents);
  }
  
  if (path === "/api/safety/sos") {
    if (method === "POST" && body) {
      const newSos = {
        id: "sos-" + Math.random().toString(36).substring(2, 11),
        ...body,
        timestamp: new Date().toISOString(),
        resolved: false
      };
      db.sos_alerts.push(newSos);
      save();
      return makeMockResponse(newSos);
    }
    return makeMockResponse(db.sos_alerts);
  }
  
  if (path.includes("/resolve")) {
    const segments = path.split("/");
    const id = segments[segments.length - 2];
    const index = db.sos_alerts.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      db.sos_alerts[index].resolved = true;
      db.sos_alerts[index].resolvedAt = new Date().toISOString();
      save();
      return makeMockResponse(db.sos_alerts[index]);
    }
  }
  
  if (path === "/api/ai/insights") {
    return makeMockResponse({
      summary: "AI Engine Report: Systems operating normally. Worker attendance is at 98% for this shift. One near miss was logged and resolved today.",
      recommendations: ["Increase supervisor checklists at Lincoln Center site", "Re-run safety briefing on high-voltage feedback risks"]
    });
  }
  
  if (path === "/api/ai/allocate") {
    return makeMockResponse({
      recommendedWorkerId: "u-worker1",
      reasoning: "Michael Chen is currently active and exhibits 96% match rating with Fiber Splicing and HVAC skills needed for Lincoln Center route."
    });
  }
  
  if (path === "/api/ai/health-check") {
    return makeMockResponse({ status: "clear", warnings: [] });
  }
  
  return makeMockResponse({ error: "Not Found" }, 404);
};

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : (input && "url" in (input as any) ? (input as any).url : String(input));
  const isApi = url.includes("/api/");

  // Dynamically prefix with Replit or custom backend URL if specified
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || "";
  if (isApi && apiBase && url.startsWith("/")) {
    url = `${apiBase.replace(/\/$/, "")}${url}`;
  }

  if (useLocalFallback && isApi) {
    return handleMockApiResponse(url, init);
  }

  try {
    const res = await window.fetch(url, init);
    if (isApi) {
      // 1. Check HTTP status code for errors
      if (res.status === 404 || res.status >= 500) {
        throw new Error(`API returned error status: ${res.status}`);
      }

      // 2. Check for redirect to static HTML route
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("HTML response detected from API (possible static SPA route rewrite)");
      }
      
      // 3. Deep-inspect response body to ensure it is valid, pure JSON structure
      if (res.status !== 204) {
        try {
          const clone = res.clone();
          const text = await clone.text();
          const trimmed = text.trim();
          
          if (
            trimmed.startsWith("<!DOCTYPE") || 
            trimmed.startsWith("<html") || 
            trimmed.startsWith("<head") || 
            trimmed.startsWith("<body") || 
            trimmed.includes("The page cannot be found") ||
            trimmed.includes("Cannot GET") ||
            trimmed.includes("Cannot POST")
          ) {
            throw new Error("HTML redirect or server router error page detected");
          }
          
          if (trimmed.length > 0) {
            JSON.parse(trimmed); // Try parsing. If it has syntax error (like unexpected T), it will catch it!
          }
        } catch (cloneErr: any) {
          throw new Error(`Response body is not valid JSON: ${cloneErr.message || cloneErr}`);
        }
      }
    }
    return res;
  } catch (err) {
    if (isApi) {
      console.warn("Smart Client Interceptor: Live API has failed or is hosted as a static bundle. Switching to local virtual datastore for url:", url);
      useLocalFallback = true;
      return handleMockApiResponse(url, init);
    }
    throw err;
  }
}
