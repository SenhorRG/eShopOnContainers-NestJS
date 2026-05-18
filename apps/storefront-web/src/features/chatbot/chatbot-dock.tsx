import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import type { ChatMessage } from '../../lib/chat-api';
import { fetchCatalogChatStatus, sendCatalogChatCompletion } from '../../lib/chat-api';

function removeChatParam(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete('chat');
  const q = params.toString();
  return q.length ? `?${q}` : '';
}

export function ChatbotDock() {
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const open = searchParams.get('chat') === 'true';

  const paneRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLAnchorElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [status, setStatus] = useState<{ available: boolean } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const closeHref = `${pathname}${removeChatParam(search)}`;

  const close = useCallback(() => {
    navigate({ pathname, search: removeChatParam(search) }, { replace: true });
  }, [navigate, pathname, search]);

  useEffect(() => {
    if (!open) return;
    void fetchCatalogChatStatus().then(setStatus);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, thinking]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const pane = paneRef.current;
    if (!pane) return;

    const focusable = () =>
      pane.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = [...focusable()].filter((n) => !n.hasAttribute('disabled'));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    pane.addEventListener('keydown', onKeyDown);
    return () => pane.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || thinking || !status?.available) return;
      setDraft('');
      const userMsg: ChatMessage = { role: 'user', content: text };
      let nextThread: ChatMessage[] = [];
      setMessages((prev) => {
        nextThread = [...prev, userMsg];
        return nextThread;
      });
      setThinking(true);
      try {
        const reply = await sendCatalogChatCompletion(nextThread);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'My apologies, but I encountered an unexpected error.' },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [draft, status?.available, thinking],
  );

  if (!open) return null;

  const missingConfiguration = status !== null && !status.available;
  const canChat = status?.available === true;

  return (
    <div
      ref={paneRef}
      className="floating-pane"
      role="dialog"
      aria-modal="true"
      aria-label=".NET Concierge chat"
    >
      <Link
        ref={closeRef}
        to={closeHref}
        replace
        className="hide-chatbot"
        title="Close .NET Concierge"
        aria-label="Close chat"
      >
        <span>✖</span>
      </Link>

      <div ref={chatScrollRef} className="chatbot-chat">
        {!missingConfiguration &&
          messages.map((m, i) =>
            m.content ? (
              <p key={`${String(i)}-${m.role}`} className={`message message-${m.role}`}>
                {m.content}
              </p>
            ) : null,
          )}
        {missingConfiguration ? (
          <p className="message message-assistant">
            <strong>The chatbot is missing required configuration.</strong> Enable chat on the catalog service (
            <code>ESHOP_CATALOG_CHAT_ENABLED=true</code> and <code>ESHOP_OLLAMA_BASE_URL</code>) and ensure Ollama is
            running with <code>ESHOP_CATALOG_CHAT_MODEL</code>.
          </p>
        ) : null}
        {thinking ? <p className="thinking">Thinking...</p> : null}
      </div>

      <form className="chatbot-input" onSubmit={(ev) => void onSubmit(ev)}>
        <textarea
          ref={textareaRef}
          placeholder="Start chatting..."
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' && !ev.shiftKey) {
              ev.preventDefault();
              void onSubmit(ev);
            }
          }}
        />
        <button type="submit" title="Send" disabled={!canChat}>
          Send
        </button>
      </form>
    </div>
  );
}
