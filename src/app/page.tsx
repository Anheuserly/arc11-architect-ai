'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, MessageSquare, Users, ShieldAlert, Award, FileText, 
  Send, Bot, RefreshCw, Phone, Clock, Calendar, CheckCircle2,
  Sparkles, SlidersHorizontal, ArrowUpRight, Search, PlusCircle,
  Database, UserCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'leads' | 'services' | 'faqs' | 'broadcast'>('inbox');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Dispatch / Broadcast & Testing Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('+91');
  const [testRecipientName, setTestRecipientName] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! Welcome to ARC 11 Architect. We are delighted to assist with your residential project requirements.');
  const [testScheduleTime, setTestScheduleTime] = useState('');
  const [isSimulateInbound, setIsSimulateInbound] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        if (!selectedChat && data.data.length > 0) {
          loadChatDetail(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadChatDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedChat(data.data);
        setChatMessages(data.data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) setServices(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (data.success) setFaqs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
    loadLeads();
    loadServices();
    loadFaqs();
  }, []);

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChat) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedChat.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', text: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        loadChatDetail(selectedChat.id);
        loadConversations();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = async () => {
    if (!selectedChat) return;
    await fetch(`/api/conversations/${selectedChat.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'takeover' }),
    });
    loadChatDetail(selectedChat.id);
    loadConversations();
  };

  const handleResumeAi = async () => {
    if (!selectedChat) return;
    await fetch(`/api/conversations/${selectedChat.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume_ai' }),
    });
    loadChatDetail(selectedChat.id);
    loadConversations();
  };

  const handleDispatchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestStatus('Dispatching...');
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: testPhone,
          recipientName: testRecipientName,
          messageText: testMessage,
          scheduleTime: testScheduleTime || null,
          isSimulateIncoming: isSimulateInbound,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('Message successfully queued & processed!');
        setTimeout(() => {
          setIsTestModalOpen(false);
          setTestStatus(null);
          loadConversations();
          loadLeads();
        }, 1200);
      } else {
        setTestStatus(`Error: ${data.error || 'Failed'}`);
      }
    } catch {
      setTestStatus('Failed to send. Please check your network.');
    }
  };

  const filteredConversations = conversations.filter(c => {
    const term = searchQuery.toLowerCase();
    return (
      (c.contact?.name && c.contact.name.toLowerCase().includes(term)) ||
      (c.contact?.phoneNumber && c.contact.phoneNumber.includes(term)) ||
      (c.messages?.[0]?.body && c.messages[0].body.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex h-screen bg-[#faf7f2] text-[#1c1a17] font-sans overflow-hidden">
      {/* Architectural Left Brand Sidebar */}
      <aside className="w-72 border-r border-[#42382c]/10 bg-[#f4ede3]/80 backdrop-blur-md flex flex-col justify-between z-20">
        <div>
          {/* Logo & Identity */}
          <div className="p-6 border-b border-[#42382c]/10">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 bg-[#9b6843] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#9b6843]/20">
                <Building2 className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold tracking-tight text-[#1c1a17]">ARC 11 ARCHITECT</h1>
                <p className="text-[10px] uppercase tracking-widest text-[#9b6843] font-medium">WhatsApp AI Suite</p>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="w-full py-2.5 px-4 bg-[#9b6843] hover:bg-[#835534] text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm transition hover:shadow"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Send / Test Message</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition ${
                activeTab === 'inbox' 
                  ? 'bg-white text-[#9b6843] shadow-sm border border-[#42382c]/10 font-semibold' 
                  : 'text-[#6b645c] hover:bg-white/60 hover:text-[#1c1a17]'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 stroke-[2]" />
                <span>Active Inbox</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'inbox' ? 'bg-[#9b6843]/10 text-[#9b6843]' : 'bg-[#42382c]/5 text-[#6b645c]'
              }`}>
                {conversations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition ${
                activeTab === 'leads' 
                  ? 'bg-white text-[#9b6843] shadow-sm border border-[#42382c]/10 font-semibold' 
                  : 'text-[#6b645c] hover:bg-white/60 hover:text-[#1c1a17]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 stroke-[2]" />
                <span>Project Enquiries & Leads</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'leads' ? 'bg-[#9b6843]/10 text-[#9b6843]' : 'bg-[#42382c]/5 text-[#6b645c]'
              }`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition ${
                activeTab === 'services' 
                  ? 'bg-white text-[#9b6843] shadow-sm border border-[#42382c]/10 font-semibold' 
                  : 'text-[#6b645c] hover:bg-white/60 hover:text-[#1c1a17]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 stroke-[2]" />
                <span>Official Services</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#42382c]/5 text-[#6b645c] font-mono">
                {services.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition ${
                activeTab === 'faqs' 
                  ? 'bg-white text-[#9b6843] shadow-sm border border-[#42382c]/10 font-semibold' 
                  : 'text-[#6b645c] hover:bg-white/60 hover:text-[#1c1a17]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 stroke-[2]" />
                <span>Knowledge Base & FAQs</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#42382c]/5 text-[#6b645c] font-mono">
                {faqs.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Server & Database Telemetry Footer */}
        <div className="p-4 m-3 rounded-2xl bg-white/70 border border-[#42382c]/10 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-[#1c1a17]">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Windows Server (vps.amcmep.in)</span>
          </div>
          <div className="text-[11px] text-[#6b645c] mt-1 flex items-center justify-between">
            <span>Database: arc11architect</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>
          </div>
        </div>
      </aside>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white/50">
        {activeTab === 'inbox' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation List Column */}
            <div className="w-84 border-r border-[#42382c]/10 flex flex-col bg-white/70">
              {/* Search Bar */}
              <div className="p-4 border-b border-[#42382c]/10 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-[#a8a096]" />
                  <input
                    type="text"
                    placeholder="Search client or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f4ede3]/60 border border-[#42382c]/10 rounded-xl pl-8 pr-3 py-2 text-xs text-[#1c1a17] focus:outline-none focus:border-[#9b6843]"
                  />
                </div>
                <button 
                  onClick={loadConversations} 
                  title="Refresh conversations"
                  className="p-2 text-[#6b645c] hover:text-[#1c1a17] rounded-lg hover:bg-[#42382c]/5 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* List of Clients */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#42382c]/5">
                {filteredConversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadChatDetail(c.id)}
                    className={`p-4 cursor-pointer transition ${
                      selectedChat?.id === c.id 
                        ? 'bg-[#ebdccf]/50 border-l-4 border-[#9b6843]' 
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#1c1a17] truncate max-w-[170px]">
                        {c.contact?.name || `+${c.contact?.phoneNumber}`}
                      </span>
                      <span className="text-[10px] text-[#a8a096]">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#6b645c]">
                      <span className="truncate max-w-[160px] text-[11px] opacity-90">
                        {c.messages?.[0]?.body || 'New dialogue'}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                          c.status === 'HUMAN_REQUIRED'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : c.status === 'HUMAN_ACTIVE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.status === 'HUMAN_REQUIRED' ? 'Handoff' : c.status === 'HUMAN_ACTIVE' ? 'Manual' : 'AI Active'}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-[#a8a096] text-xs">
                    No matching conversations.<br />
                    Click &quot;Send / Test Message&quot; above to simulate an incoming message.
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Active Chat Canvas */}
            <div className="flex-1 flex flex-col bg-radial from-white to-[#faf6f0]">
              {selectedChat ? (
                <>
                  {/* Chat Studio Header */}
                  <div className="h-16 border-b border-[#42382c]/10 px-6 flex items-center justify-between bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ebdccf] flex items-center justify-center text-[#9b6843] font-bold text-xs">
                        {selectedChat.contact?.name ? selectedChat.contact.name[0] : 'C'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-[#1c1a17]">{selectedChat.contact?.name}</h3>
                        <p className="text-[11px] text-[#6b645c] font-mono">+{selectedChat.contact?.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {selectedChat.status === 'BOT_ACTIVE' ? (
                        <button
                          onClick={handleTakeover}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Take Over (Handoff Mode)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleResumeAi}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Bot className="h-3.5 w-3.5" />
                          <span>Resume ARC 11 AI</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl p-4 text-xs shadow-xs leading-relaxed ${
                            m.direction === 'OUTBOUND'
                              ? m.senderType === 'human_agent'
                                ? 'bg-[#9b6843] text-white rounded-br-xs'
                                : 'bg-[#835534] text-white rounded-br-xs'
                              : 'bg-white text-[#1c1a17] border border-[#42382c]/10 rounded-bl-xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{m.body}</div>
                          <div className={`text-[10px] mt-2 flex items-center justify-end gap-1.5 ${
                            m.direction === 'OUTBOUND' ? 'text-white/70' : 'text-[#a8a096]'
                          }`}>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.direction === 'OUTBOUND' && <span>• {m.senderType === 'human_agent' ? 'Architect' : 'AI Assistant'}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input Dock */}
                  <div className="p-4 border-t border-[#42382c]/10 bg-white/90 backdrop-blur-sm flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type a response to this client as ARC 11 Architect..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-[#f4ede3]/50 border border-[#42382c]/15 rounded-xl px-4 py-3 text-xs text-[#1c1a17] focus:outline-none focus:border-[#9b6843] transition"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !replyText.trim()}
                      className="h-11 px-5 bg-[#9b6843] hover:bg-[#835534] disabled:opacity-50 text-white rounded-xl text-xs font-medium transition flex items-center gap-2 shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#a8a096] text-xs space-y-2">
                  <MessageSquare className="h-8 w-8 stroke-[1.5] text-[#9b6843]/40" />
                  <span>Select any conversation or test a message to open dialogue</span>
                </div>
              )}
            </div>

            {/* Client Architectural Profile Inspector */}
            {selectedChat && (
              <div className="w-84 border-l border-[#42382c]/10 p-6 bg-[#f4ede3]/30 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9b6843] mb-3">Client Information</h4>
                  <div className="p-4 bg-white rounded-2xl border border-[#42382c]/10 space-y-2 text-xs shadow-xs">
                    <div>
                      <span className="text-[#a8a096]">Name:</span> <span className="font-semibold text-[#1c1a17]">{selectedChat.contact?.name}</span>
                    </div>
                    <div>
                      <span className="text-[#a8a096]">WhatsApp:</span> <span className="font-mono text-[#1c1a17]">+{selectedChat.contact?.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-[#a8a096]">Registered:</span> <span className="text-[#6b645c]">{new Date(selectedChat.contact?.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9b6843] mb-3">Captured Project Enquiries</h4>
                  {selectedChat.contact?.leads?.map((lead: any) => (
                    <div key={lead.id} className="p-4 bg-white rounded-2xl border border-[#9b6843]/20 text-xs space-y-2 shadow-xs mb-3">
                      <div className="font-semibold text-[#9b6843] flex items-center justify-between">
                        <span>{lead.projectType}</span>
                        <span className="text-[9px] bg-[#9b6843]/10 text-[#9b6843] px-2 py-0.5 rounded-full font-sans uppercase">Lead</span>
                      </div>
                      <div className="space-y-1 text-[#6b645c] text-[11px]">
                        <div>📍 <span className="text-[#1c1a17] font-medium">{lead.location}</span></div>
                        <div>📐 Plot: <span className="text-[#1c1a17] font-medium">{lead.plotArea}</span></div>
                        <div>🏢 Floors: <span className="text-[#1c1a17] font-medium">{lead.floors}</span></div>
                      </div>
                      {lead.requirements && (
                        <div className="p-2.5 bg-[#f4ede3]/50 rounded-xl text-[11px] text-[#1c1a17] italic">
                          &quot;{lead.requirements}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedChat.contact?.leads || selectedChat.contact?.leads.length === 0) && (
                    <div className="p-4 bg-white/60 rounded-xl border border-dashed border-[#42382c]/15 text-xs text-[#a8a096] italic text-center">
                      No project enquiry captured yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Project Leads Tab */}
        {activeTab === 'leads' && (
          <div className="p-8 overflow-y-auto flex-1 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1c1a17]">Architectural Leads & Enquiries</h2>
                <p className="text-xs text-[#6b645c] mt-1">Qualified progressively via 24/7 WhatsApp customer conversations</p>
              </div>
              <button onClick={loadLeads} className="px-4 py-2 bg-white border border-[#42382c]/10 rounded-xl text-xs font-medium text-[#1c1a17] hover:bg-[#f4ede3] flex items-center gap-2 shadow-xs transition">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh Pipeline
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {leads.map((l) => (
                <div key={l.id} className="p-6 bg-white border border-[#42382c]/10 rounded-2xl space-y-4 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#ebdccf] text-[#9b6843]">
                      {l.projectType}
                    </span>
                    <span className="text-[11px] text-[#a8a096] font-mono">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1c1a17]">{l.contact?.name || 'Client'}</h3>
                    <p className="text-xs text-[#6b645c] font-mono">+{l.contact?.phoneNumber}</p>
                  </div>
                  <div className="text-xs space-y-1.5 p-3.5 bg-[#f7f3ec] rounded-xl border border-[#42382c]/5 text-[#6b645c]">
                    <div>📍 Location: <span className="text-[#1c1a17] font-semibold">{l.location}</span></div>
                    <div>📐 Plot Size: <span className="text-[#1c1a17] font-semibold">{l.plotArea}</span></div>
                    <div>🏢 Floors: <span className="text-[#1c1a17] font-semibold">{l.floors}</span></div>
                    {l.requirements && <div className="mt-2 text-[#1c1a17] italic text-[11px]">&quot;{l.requirements}&quot;</div>}
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#a8a096] text-xs">
                  No captured leads yet.<br />Trigger the flow via WhatsApp by sending &quot;I need a house design&quot; or selecting &quot;7&quot;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="p-8 overflow-y-auto flex-1 max-w-6xl mx-auto w-full">
            <h2 className="font-display text-2xl font-bold text-[#1c1a17] mb-1">Approved ARC 11 Architect Services</h2>
            <p className="text-xs text-[#6b645c] mb-8">Authoritative service information used by the WhatsApp AI layer</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {services.map((s) => (
                <div key={s.id} className="p-6 bg-white border border-[#42382c]/10 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-[#1c1a17]">{s.title}</h3>
                    <span className="text-[11px] uppercase tracking-wider text-[#9b6843] font-semibold">{s.category}</span>
                  </div>
                  <p className="text-xs text-[#6b645c] leading-relaxed">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {s.keyFeatures?.map((f: string, i: number) => (
                      <span key={i} className="text-[10px] bg-[#f7f3ec] text-[#1c1a17] px-2.5 py-1 rounded-lg border border-[#42382c]/5 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Knowledge Base Tab */}
        {activeTab === 'faqs' && (
          <div className="p-8 overflow-y-auto flex-1 max-w-4xl mx-auto w-full">
            <h2 className="font-display text-2xl font-bold text-[#1c1a17] mb-1">Knowledge Base & FAQs</h2>
            <p className="text-xs text-[#6b645c] mb-8">Approved questions & answers for high-confidence AI reasoning</p>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.id} className="p-5 bg-white border border-[#42382c]/10 rounded-2xl space-y-2.5 shadow-xs">
                  <div className="font-semibold text-sm text-[#9b6843]">Q: {f.question}</div>
                  <div className="text-xs text-[#1c1a17] leading-relaxed">{f.answer}</div>
                  <div className="flex items-center gap-2 pt-2 text-[10px] text-[#a8a096] uppercase tracking-wider font-mono">
                    <span>Category: {f.category}</span>
                    <span>•</span>
                    <span>Keywords: {f.keywords?.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Dispatch & Schedule Test Message Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#42382c]/10 rounded-3xl p-7 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#42382c]/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Send className="h-5 w-5 text-[#9b6843]" />
                <h3 className="font-display font-bold text-base text-[#1c1a17]">Dispatch / Schedule Message</h3>
              </div>
              <button 
                onClick={() => setIsTestModalOpen(false)}
                className="text-[#a8a096] hover:text-[#1c1a17] text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6b645c] font-medium mb-1">Target Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full bg-[#f4ede3]/40 border border-[#42382c]/15 rounded-xl px-3.5 py-2.5 text-[#1c1a17] focus:outline-none focus:border-[#9b6843]"
                />
              </div>

              <div>
                <label className="block text-[#6b645c] font-medium mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Sharma"
                  value={testRecipientName}
                  onChange={(e) => setTestRecipientName(e.target.value)}
                  className="w-full bg-[#f4ede3]/40 border border-[#42382c]/15 rounded-xl px-3.5 py-2.5 text-[#1c1a17] focus:outline-none focus:border-[#9b6843]"
                />
              </div>

              <div>
                <label className="block text-[#6b645c] font-medium mb-1">Message Text</label>
                <textarea
                  rows={4}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-[#f4ede3]/40 border border-[#42382c]/15 rounded-xl px-3.5 py-2.5 text-[#1c1a17] focus:outline-none focus:border-[#9b6843]"
                />
              </div>

              <div className="p-3 bg-[#ebdccf]/40 rounded-xl border border-[#9b6843]/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1c1a17]">Simulate Incoming Customer Message</div>
                  <div className="text-[11px] text-[#6b645c]">Triggers ARC 11 automation and lead capture flow</div>
                </div>
                <input
                  type="checkbox"
                  checked={isSimulateInbound}
                  onChange={(e) => setIsSimulateInbound(e.target.checked)}
                  className="h-4 w-4 accent-[#9b6843]"
                />
              </div>

              <div>
                <label className="block text-[#6b645c] font-medium mb-1">Schedule Timestamp (Optional)</label>
                <input
                  type="datetime-local"
                  value={testScheduleTime}
                  onChange={(e) => setTestScheduleTime(e.target.value)}
                  className="w-full bg-[#f4ede3]/40 border border-[#42382c]/15 rounded-xl px-3.5 py-2.5 text-[#1c1a17] focus:outline-none focus:border-[#9b6843]"
                />
              </div>

              {testStatus && (
                <div className="p-3 bg-[#f7f3ec] text-[#9b6843] rounded-xl text-center font-medium">
                  {testStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#42382c]/10">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-[#6b645c] hover:text-[#1c1a17]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9b6843] hover:bg-[#835534] text-white rounded-xl font-medium shadow-xs"
                >
                  Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
