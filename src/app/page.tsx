'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, MessageSquare, Users, ShieldAlert, Award, FileText, 
  Send, Bot, CheckCircle, Clock, RefreshCw, LogOut, ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'leads' | 'services' | 'faqs'>('inbox');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
  };

  const handleResumeAi = async () => {
    if (!selectedChat) return;
    await fetch(`/api/conversations/${selectedChat.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume_ai' }),
    });
    loadChatDetail(selectedChat.id);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-wide text-white">ARC 11 ARCHITECT</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">WhatsApp & AI Suite</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'inbox' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4" />
                <span>Live Inbox</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                {conversations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'leads' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4" />
                <span>Project Leads</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'services' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4" />
                <span>Official Services</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                {services.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'faqs' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4" />
                <span>AI Knowledge FAQs</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
                {faqs.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PostgreSQL: Windows Server</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">DB: arc11architect</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'inbox' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/20">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-200">Conversations</h2>
                <button onClick={loadConversations} className="text-slate-400 hover:text-white">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadChatDetail(c.id)}
                    className={`p-3.5 cursor-pointer transition ${
                      selectedChat?.id === c.id ? 'bg-slate-800/80 border-l-2 border-amber-500' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-200">{c.contact?.name || c.contact?.phoneNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[170px]">{c.messages?.[0]?.body || 'New conversation'}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          c.status === 'HUMAN_REQUIRED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : c.status === 'HUMAN_ACTIVE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {c.status === 'HUMAN_REQUIRED' ? 'Handoff' : c.status === 'HUMAN_ACTIVE' ? 'Manual' : 'AI Active'}
                      </span>
                    </div>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No active conversations yet.<br />Send a message to your WhatsApp number to test.
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col bg-slate-950">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="h-14 border-b border-slate-800 px-5 flex items-center justify-between bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-sm text-white">{selectedChat.contact?.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">+{selectedChat.contact?.phoneNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedChat.status === 'BOT_ACTIVE' ? (
                        <button
                          onClick={handleTakeover}
                          className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Take Over (Disable Bot)</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleResumeAi}
                          className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Bot className="h-3.5 w-3.5" />
                          <span>Resume AI Bot</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
                    {chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl p-3.5 text-xs shadow-sm ${
                            m.direction === 'OUTBOUND'
                              ? m.senderType === 'human_agent'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-100 border border-slate-700/60'
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                          <div className="text-[10px] mt-1.5 opacity-70 flex items-center justify-end gap-1">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.direction === 'OUTBOUND' && <span>• {m.senderType}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type a manual WhatsApp reply as ARC 11 Architect agent..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !replyText.trim()}
                      className="h-10 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  Select a conversation to view messages
                </div>
              )}
            </div>

            {/* Client Context Panel */}
            {selectedChat && (
              <div className="w-80 border-l border-slate-800 p-5 bg-slate-900/30 overflow-y-auto space-y-5">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Client Profile</h4>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Name:</span> <span className="text-white font-medium">{selectedChat.contact?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span> <span className="font-mono text-slate-300">+{selectedChat.contact?.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Language:</span> <span className="uppercase text-slate-300">{selectedChat.contact?.preferredLanguage}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Associated Leads</h4>
                  {selectedChat.contact?.leads?.map((lead: any) => (
                    <div key={lead.id} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs space-y-1.5 mb-2">
                      <div className="font-medium text-amber-300">{lead.projectType}</div>
                      <div className="text-slate-400">📍 {lead.location}</div>
                      <div className="text-slate-400">📐 Area: {lead.plotArea}</div>
                      <div className="text-slate-400">🏢 Floors: {lead.floors}</div>
                      <div className="text-slate-300 mt-1 italic">&quot;{lead.requirements}&quot;</div>
                    </div>
                  ))}
                  {(!selectedChat.contact?.leads || selectedChat.contact?.leads.length === 0) && (
                    <div className="text-xs text-slate-500 italic">No project lead captured yet</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="p-8 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Architectural Project Leads</h2>
                <p className="text-xs text-slate-400">Captured progressively via WhatsApp automation</p>
              </div>
              <button onClick={loadLeads} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((l) => (
                <div key={l.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {l.projectType}
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-white">{l.contact?.name || 'Client'}</h3>
                    <p className="text-xs text-slate-400 font-mono">+{l.contact?.phoneNumber}</p>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div>📍 Location: <span className="text-white font-medium">{l.location}</span></div>
                    <div>📐 Plot Size: <span className="text-white font-medium">{l.plotArea}</span></div>
                    <div>🏢 Floors: <span className="text-white font-medium">{l.floors}</span></div>
                    {l.requirements && <div className="mt-1 text-slate-400 italic">&quot;{l.requirements}&quot;</div>}
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  No leads recorded yet. Trigger the flow on WhatsApp by typing &quot;Need a house design&quot; or selecting &quot;7&quot;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="p-8 overflow-y-auto flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Approved ARC 11 Services</h2>
            <p className="text-xs text-slate-400 mb-6">These services are used to ground WhatsApp auto-responses and AI replies</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((s) => (
                <div key={s.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white text-sm">{s.title}</h3>
                    <span className="text-[11px] text-amber-400 font-mono">{s.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {s.keyFeatures?.map((f: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="p-8 overflow-y-auto flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Official Knowledge Base & FAQs</h2>
            <p className="text-xs text-slate-400 mb-6">High-confidence answers used by the WhatsApp AI layer</p>
            <div className="space-y-3 max-w-3xl">
              {faqs.map((f) => (
                <div key={f.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <div className="font-medium text-sm text-amber-300">Q: {f.question}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">A: {f.answer}</div>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
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
    </div>
  );
}
