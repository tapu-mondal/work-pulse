import React, { useState } from "react";
import { User } from "../types";
import { Shield, Settings, UserPlus, Trash, Sparkles, Check, DollarSign, Briefcase, Landmark, RefreshCw } from "lucide-react";

interface AdminWorkspaceProps {
  users: User[];
  loggedInUser: User;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

export default function AdminWorkspace({ users, loggedInUser, onUpdateUser }: AdminWorkspaceProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [hourlyRate, setHourlyRate] = useState(20);
  const [role, setRole] = useState<"worker" | "manager" | "admin">("worker");

  // System Configuration Policies
  const [gracePeriod, setGracePeriod] = useState(() => localStorage.getItem("sys_grace_period") || "15");
  const [geofenceRadius, setGeofenceRadius] = useState(() => localStorage.getItem("sys_geofence_radius") || "200");
  const [biometricMatch, setBiometricMatch] = useState(() => localStorage.getItem("sys_biometric_match") || "95");
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setDesignation(user.designation);
    setDepartment(user.department);
    setHourlyRate(user.hourlyRate);
    setRole(user.role);
  };

  const saveUserSettings = async (id: string) => {
    await onUpdateUser(id, {
      designation,
      department,
      hourlyRate: Number(hourlyRate) || 12,
      role
    });
    setEditingUserId(null);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("sys_grace_period", gracePeriod);
    localStorage.setItem("sys_geofence_radius", geofenceRadius);
    localStorage.setItem("sys_biometric_match", biometricMatch);
    setPolicyMessage("✅ Operational variables saved persistently in secure agency storage.");
    setTimeout(() => setPolicyMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Row for Administration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex items-center space-x-3 shadow-md relative overflow-hidden">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-505/20 rounded-xl relative z-10">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-300">ADMIN CONTROL GATEWAY</p>
            <h3 className="text-lg font-bold font-display">{users.length} Active System Terminals</h3>
            <p className="text-[10px] text-slate-400 font-medium">Total personnel profiles synced live</p>
          </div>
          <span className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-505/5 rounded-full pointer-events-none"></span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">AGENCY LIABILITIES BALANCE</p>
            <h3 className="text-lg font-bold font-display text-slate-805">
              ${users.reduce((acc, curr) => acc + (curr.hourlyRate || 20), 0) * 160}/mo est.
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Total hourly base liability estimates</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">CRITICAL RADIUS GEOFENCE</p>
            <h3 className="text-lg font-bold font-display text-slate-800">{geofenceRadius} Meters</h3>
            <p className="text-[10px] text-amber-600 font-semibold font-mono">Radial compliance bubble</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Manage Workforce Team Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 overflow-hidden">
          <div className="p-4.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Manage Personnel Directory</h3>
              <p className="text-xs text-slate-400">Reassign department hierarchies, adjust compensation variables & toggle credentials status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-mono text-[9px] uppercase font-bold text-slate-400 bg-slate-50/50">
                  <th className="p-4">Personnel</th>
                  <th className="p-4">Operational Status</th>
                  <th className="p-4">Designation & Wage</th>
                  <th className="p-4 text-right">Credentials Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((user) => {
                  const isEditing = editingUserId === user.id;
                  const isSelf = loggedInUser.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          <div>
                            <div className="font-bold text-slate-850 flex items-center">
                              <span>{user.name}</span>
                              {isSelf && <span className="ml-1 px-1 bg-indigo-50 text-indigo-700 text-[8px] rounded uppercase font-bold tracking-wider">You</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="space-y-1">
                            <label className="text-[8px] font-mono uppercase font-bold text-slate-405">Security Role</label>
                            <select
                              value={role}
                              onChange={(e) => setRole(e.target.value as any)}
                              className="w-full text-xs border border-slate-200 bg-white rounded px-2 py-1 focus:outline-none"
                            >
                              <option value="worker">Worker / Employee</option>
                              <option value="manager">Supervisor / Manager</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border capitalize ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : user.role === "manager"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-teal-50 text-teal-700 border-teal-200"
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="space-y-1.5 w-40">
                            <input
                              type="text"
                              title="Department"
                              placeholder="Department"
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              className="w-full border border-slate-200 rounded p-1 text-[11px]"
                            />
                            <input
                              type="text"
                              title="Designation"
                              placeholder="Designation"
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                              className="w-full border border-slate-200 rounded p-1 text-[11px]"
                            />
                            <div className="flex items-center space-x-1 border border-slate-200 rounded p-1">
                              <DollarSign className="w-3 h-3 text-slate-400 shrink-0" />
                              <input
                                type="number"
                                title="Hourly wage rate value"
                                placeholder="Hourly rate"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(Number(e.target.value))}
                                className="w-full text-[11px] focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-700 flex items-center">
                              <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                              <span>{user.designation}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">({user.department}) • <span className="font-mono text-emerald-600 font-bold">${user.hourlyRate}/hr</span></div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => saveUserSettings(user.id)}
                            className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 inline-flex cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(user)}
                            className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center space-x-1 inline-flex cursor-pointer transition-colors"
                          >
                            <span>Override Parameters</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Configure System Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-1 h-fit">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 font-display">Tuning System Policy</h3>
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Shift Grace Period (Minutes)</label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full text-xs font-semibold focus:outline-none border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"
                placeholder="Minutes allowed before marked Late"
              />
              <p className="text-[10px] text-slate-505 text-slate-400">Duration in minutes allowed for check-in after shift starting line.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Geofence Compliance Circle (Meters)</label>
              <input
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-full text-xs font-semibold focus:outline-none border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"
                placeholder="Hub tolerance radius bounds"
              />
              <p className="text-[10px] text-slate-505 text-slate-400">Perimeter radius in meters within which a worker check-in coordinates are deemed compliant.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Biometric Scan Confidence Threshold (%)</label>
              <input
                type="number"
                value={biometricMatch}
                onChange={(e) => setBiometricMatch(e.target.value)}
                className="w-full text-xs font-semibold focus:outline-none border border-slate-200 rounded-xl p-2.5 bg-slate-50/50"
                placeholder="Confidence match rate threshold"
              />
              <p className="text-[10px] text-slate-505 text-slate-400">Holographic landmark accuracy model minimum threshold match rates.</p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Apply System-Wide Policy
            </button>
          </form>

          {policyMessage && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-[11px] font-bold text-indigo-900 animate-fade-in">
              {policyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
