import { Outlet } from 'react-router-dom';

import { ChatbotDock } from '../features/chatbot/chatbot-dock';
import { ErrorUiBanner } from './error-ui-banner';
import { FooterBar } from './footer-bar';
import { HeaderBar } from './header-bar';
import { ShowChatbotButton } from './show-chatbot-button';

export function MainLayout() {
  return (
    <>
      <HeaderBar />
      <main>
        <Outlet />
      </main>
      <ShowChatbotButton />
      <FooterBar />
      <ErrorUiBanner />
      <ChatbotDock />
    </>
  );
}
