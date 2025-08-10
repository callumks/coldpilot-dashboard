import React, { useEffect, useState, useMemo } from 'react';

interface Message {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sentAt: string;
  isRead: boolean;
}

interface ConversationPayload {
  id: string;
  subject: string;
  contact: { id: string; name: string; email: string; company?: string | null };
  messages: Message[];
}

interface Props {
  selectedThreadId: string | null;
}

const ConversationDetail: React.FC<Props> = ({ selectedThreadId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!selectedThreadId) {
      setData(null);
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/conversations/${selectedThreadId}`);
        if (!res.ok) throw new Error('Failed to load conversation');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load conversation');
        setData(json.conversation);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedThreadId]);

  const formattedMessages = useMemo(() => {
    if (!data) return [] as Message[];
    return data.messages;
  }, [data]);

  const onSend = async () => {
    if (!data || !draft.trim()) return;
    try {
      setLoading(true);
      // Send via existing contact message route
      const res = await fetch(`/api/contacts/${data.contact.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: data.subject || 'Re: Conversation', body: draft })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Send failed');
      setDraft('');
      // Optimistic refresh
      const refreshed = await fetch(`/api/conversations/${selectedThreadId}`);
      const refreshedJson = await refreshed.json();
      if (refreshed.ok && refreshedJson.success) setData(refreshedJson.conversation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedThreadId) {
    return (
      <div className="hidden lg:block border-l border-white/[0.05] p-8 text-center text-gray-500">
        Select a conversation to view details
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="hidden lg:block border-l border-white/[0.05] p-8 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="hidden lg:block border-l border-white/[0.05] p-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="hidden lg:flex flex-col border-l border-white/[0.05] min-h-[600px]">
      <div className="p-4 border-b border-white/[0.05]">
        <div className="text-white text-sm font-medium">{data.contact.name} · {data.contact.email}</div>
        <div className="text-xs text-gray-500">{data.subject}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {formattedMessages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.direction === 'OUTBOUND' ? 'bg-blue-600/20 text-blue-100' : 'bg-white/[0.06] text-gray-100'} border border-white/[0.06]`}>
              <div className="whitespace-pre-wrap">{m.content || '(no content)'}</div>
              <div className="text-[10px] mt-1 text-gray-400">{new Date(m.sentAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/[0.05] flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your reply..."
          className="flex-1 resize-none h-20 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white text-sm p-3 outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <button onClick={onSend} disabled={loading || !draft.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm">
          Send
        </button>
      </div>
    </div>
  );
};

export default ConversationDetail;

