import { useState } from "react";
import { PayrollRecord, User } from "../types";
import { Wallet, Landmark, DollarSign, Edit3, Check, Filter, ShieldAlert } from "lucide-react";

interface PayrollSectionProps {
  payrollRecords: PayrollRecord[];
  loggedInUser: User;
  onUpdatePayroll?: (id: string, updates: any) => Promise<void>;
}

export default function PayrollSection({
  payrollRecords,
  loggedInUser,
  onUpdatePayroll
}: PayrollSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bonus, setBonus] = useState("0");
  const [incentives, setIncentives] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [status, setStatus] = useState<"Paid" | "Pending">("Pending");

  const [activeMonth, setActiveMonth] = useState<string>("2026-05");

  const isManagement = loggedInUser.role === "admin" || loggedInUser.role === "manager";

  // Filter based on user role
  const visiblePayroll = payrollRecords.filter((p) => {
    const matchesMonth = p.month === activeMonth;
    const matchesUser = loggedInUser.role !== "worker" || p.userId === loggedInUser.id;
    return matchesMonth && matchesUser;
  });

  // Calculate generic dashboard cumulative indices for the selected month representatively
  const totals = payrollRecords
    .filter((p) => p.month === activeMonth)
    .reduce(
      (acc, curr) => {
        acc.payouts += curr.totalEarnings;
        acc.hours += curr.hoursWorked;
        acc.overtime += curr.overtimeHours;
        return acc;
      },
      { payouts: 0, hours: 0, overtime: 0 }
    );

  const handleEditClick = (record: PayrollRecord) => {
    setEditingId(record.id);
    setBonus(record.bonus.toString());
    setIncentives(record.incentives.toString());
    setDeductions(record.deductions.toString());
    setStatus(record.status);
  };

  const handleSaveClick = async (id: string) => {
    if (onUpdatePayroll) {
      await onUpdatePayroll(id, {
        bonus: Number(bonus) || 0,
        incentives: Number(incentives) || 0,
        deductions: Number(deductions) || 0,
        status: status
      });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 font-mono">TOTAL SALARY BUDGET ({activeMonth})</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">${totals.payouts.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Approved workforce expenses</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 font-mono">CUMULATIVE BASE HOURS</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">{totals.hours} Regular Hours</h3>
            <p className="text-[10px] text-slate-500 font-medium">Logged across geofenced customer hubs</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 font-mono">OVERTIME ACCUMULATED</p>
            <h3 className="text-xl font-bold text-slate-900 font-display">+{totals.overtime} Overtime Hours</h3>
            <p className="text-[10px] text-amber-600 font-bold">1.5x Premium Hour multipliers</p>
          </div>
        </div>
      </div>

      {/* Primary Payroll Table board card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Title Controller bar */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-110 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display">Staff Payroll Sheets</h3>
            <p className="text-xs text-slate-400">Review hours logged, bonuses applied, and payouts completed</p>
          </div>

          {/* Month selective filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={activeMonth}
              onChange={(e) => setActiveMonth(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-203 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="2026-05">📅 May 2026 (Active)</option>
              <option value="2026-04">📅 April 2026</option>
            </select>
          </div>
        </div>

        {/* Responsive Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 font-mono text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Base Rate</th>
                <th className="p-4">Hours Logged</th>
                <th className="p-4">Overtime Status</th>
                <th className="p-4">Applied Extras</th>
                <th className="p-4 text-emerald-700">Gross Earnings</th>
                <th className="p-4">Payout Status</th>
                {isManagement && <th className="p-4 text-right">Edit Ledger</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visiblePayroll.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-sans italic">
                    No payroll summaries logged for this billing period.
                  </td>
                </tr>
              ) : (
                visiblePayroll.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Month: {item.month}</div>
                      </td>
                      <td className="p-4 font-mono font-semibold">${item.hourlyRate}/hr</td>
                      <td className="p-4 font-mono">{item.hoursWorked} hrs</td>
                      <td className="p-4 font-mono text-amber-600">+{item.overtimeHours} hrs</td>
                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 w-20">
                            <input
                              type="number"
                              title="Value representing applied bonus"
                              placeholder="Bonus"
                              value={bonus}
                              onChange={(e) => setBonus(e.target.value)}
                              className="border border-slate-200 rounded p-1 text-[11px]"
                            />
                            <input
                              type="number"
                              title="Value representing applied incentives"
                              placeholder="Incent"
                              value={incentives}
                              onChange={(e) => setIncentives(e.target.value)}
                              className="border border-slate-200 rounded p-1 text-[11px]"
                            />
                            <input
                              type="number"
                              title="Value representing applied deductions"
                              placeholder="Deduct"
                              value={deductions}
                              onChange={(e) => setDeductions(e.target.value)}
                              className="border border-slate-200 rounded p-1 text-[11px] text-red-650"
                            />
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-[10px] text-slate-500 font-medium">
                            <div>Gifted Bonus: <span className="font-bold text-emerald-650">+${item.bonus}</span></div>
                            <div>Incentives: <span className="font-semibold text-sky-650">+${item.incentives}</span></div>
                            <div>Deductions: <span className="font-semibold text-red-500">-${item.deductions}</span></div>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900 font-mono text-sm">
                        ${item.totalEarnings}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="text-xs border border-slate-200 rounded p-1 bg-white focus:outline-none"
                          >
                            <option value="Paid">🟢 Direct Paid</option>
                            <option value="Pending">🟡 Pending Verification</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            item.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      {isManagement && (
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveClick(item.id)}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold flex items-center space-x-1 inline-flex cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Apply Change</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold flex items-center space-x-1 inline-flex cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-slate-400" />
                              <span>Adjust Wage</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
