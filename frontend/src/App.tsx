// File: src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/Header';
import Dashboard from '@/pages/Dashboard';
import MintTicket from '@/pages/MintTicket';
import VerifyTicket from '@/pages/VerifyTicket';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ticketchain-theme">
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mint" element={<MintTicket />} />
            <Route path="/verify" element={<VerifyTicket />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="py-6 border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TicketChain. All rights reserved.</p>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
