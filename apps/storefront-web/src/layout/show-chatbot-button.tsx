import { Link, useLocation } from 'react-router-dom';

function withChatParam(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.set('chat', 'true');
  const q = params.toString();
  return q.length ? `?${q}` : '?chat=true';
}

export function ShowChatbotButton() {
  if (import.meta.env.VITE_ESHOP_HIDE_CHATBOT === 'true') {
    return null;
  }

  const { pathname, search } = useLocation();
  const to = `${pathname}${withChatParam(search)}`;

  return (
    <Link className="show-chatbot" to={to} title="Show chatbot" aria-label="Show chatbot" />
  );
}
