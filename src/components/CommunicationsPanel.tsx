import React, { useState } from "react";
import { TeamAnnouncement, ChatMessage, User } from "../types";
import { Send, Volume2, ShieldAlert, AlertOctagon, Radio, MessageSquare, Megaphone, BellRing, Sparkles } from "lucide-react";

interface CommunicationsPanelProps {
  announcements: TeamAnnouncement[];
  chats: ChatMessage[];
  users: User[];
  loggedInUser: User;
  onAddAnnouncement: (announcementData: any) => Promise<void>;
  onSendMessage: (chatData: any) => Promise<void>;
}

export default function CommunicationsPanel({
  announcements,
  chats,
  users,
  loggedInUser,
  onAddAnnouncement,
  onSendMessage
}: CommunicationsPanelProps) {
  const [chatInput, setChatInput] = useState("");
  const [activeReceiverId, setActiveReceiverId] = useState<string>("all"); // Broadcast to all default

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annImportant, setAnnImportant] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);

  const canPostAnn = loggedInUser.role === "admin" || loggedInUser.role === "manager";
  const chatParticipants = users.filter((u) => u.id !== loggedInUser.id);

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    await onSendMessage({
      senderId: loggedInUser.id,
      senderName: loggedInUser.name,
      receiverId: activeReceiverId,
      content: chatInput.trim()
    });

    setChatInput("");
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    await onAddAnnouncement({
      title: annTitle,
      content: annContent,
      createdBy: loggedInUser.name,
      important: annImportant
    });

    setAnnTitle("");
    setAnnContent("");
    setAnnImportant(false);
    setShowAnnForm(false);
  };

  // Filter messages relevant to current loggedIn user
  const relevantChats = chats.filter((c) => {
    // Show broadcast messages
    if (c.receiverId === "all") return true;
    // Show private messages matching me
    return c.senderId === loggedInUser.id || c.receiverId === loggedInUser.id;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      
      {/* Announcements & Hazard Overlays (Left Column: 5 Cols) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-indigo-600 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Logistics Broadcast Board</h3>
            </div>
            {canPostAnn && (
              <button
                onClick={() => setShowAnnForm(!showAnnForm)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-slate-100 text-[10px] font-bold text-indigo-600 rounded-lg border border-indigo-200 transitioning cursor-pointer"
              >
                {showAnnForm ? "Close Form" : "Broadcast Alert"}
              </button>
            )}
          </div>

          {/* New announcement input panel */}
          {showAnnForm && canPostAnn && (
            <form onSubmit={handleAnnSubmit} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-fade-in text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Broadcast Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hazardous weather warning - Sector F"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Directive Scope Content</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Write clear operational guidelines for field operatives..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-lg p-2 bg-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={annImportant}
                  onChange={(e) => setAnnImportant(e.target.checked)}
                  className="rounded border-slate-350 text-indigo-605"
                />
                <label htmlFor="urgentCheck" className="text-[11px] font-bold text-rose-600 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Flag as Hazardous Critical Warning
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                Publish Broadcast
              </button>
            </form>
          )}

          {/* Announcements Lists */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center italic py-12">No system-wide broadcasts posted.</p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3 rounded-xl border font-sans text-xs transitioning ${
                    ann.important
                      ? "bg-rose-50 border-rose-200 text-rose-950 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-bold leading-tight flex items-center pr-2">
                      {ann.important && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 mr-1 shrink-0 animate-ping" />}
                      {ann.title}
                    </h4>
                    <span className="text-[9px] font-mono shrink-0 font-bold px-1.5 py-0.5 rounded-md bg-stone-200/50 text-stone-600">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-600 bg-white/50 p-2 rounded-lg border border-stone-100">
                    {ann.content}
                  </p>
                  <div className="text-[9px] font-bold mt-2 text-stone-400 font-mono text-right">
                    Published by: {ann.createdBy}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 bg-red-105 border border-red-200/40 rounded-xl bg-red-50 text-rose-950 text-[11px] flex items-center space-x-2 font-semibold">
          <Radio className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
          <span>Active Operations: All units remain in secure state. Emergency SOS services online.</span>
        </div>
      </div>

      {/* Live Messenger (Right Column: 7 Cols) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-7 flex flex-col justify-between min-h-[450px]">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 font-display">Operative Radio Feed</h3>
            </div>
            
            {/* Direct Channel selective selector */}
            <select
              value={activeReceiverId}
              onChange={(e) => setActiveReceiverId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold text-slate-700"
            >
              <option value="all">📻 Broadcast channel (all)</option>
              {chatParticipants.map((p) => (
                <option key={p.id} value={p.id}>
                  ✉️ Direct Chat- {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Chats listing box */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 min-h-[220px] flex flex-col justify-end">
            <div className="space-y-3.5">
              {relevantChats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center italic py-20">No messages logged in this radio channel.</p>
              ) : (
                relevantChats.map((msg) => {
                  const isMe = msg.senderId === loggedInUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] font-sans text-xs ${
                        isMe ? "ml-auto items-end animate-slice-left" : "items-start animate-slice-right"
                      }`}
                    >
                      {/* Name tag */}
                      <span className="text-[9px] font-bold text-slate-400 font-mono mb-0.5">
                        {isMe ? "You" : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* Bullet Text block */}
                      <div className={`p-2.5 rounded-2xl ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-150"
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action input footer */}
        <form onSubmit={handleSendMessageSubmit} className="pt-4 border-t border-slate-100 flex items-center space-x-2 mt-4">
          <input
            type="text"
            required
            placeholder={
              activeReceiverId === "all"
                ? "Radio-transmit message to all operatives..."
                : `Type private signal to employee...`
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 text-xs border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl p-3 bg-slate-50"
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            title="Transmit coordinates"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
