import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock App component that doesn't depend on contract artifacts
const AppMock: React.FC = () => {
  return (
    <div>
      <header>
        <h1>TicketChain</h1>
      </header>
      <main>Mock App Content</main>
      <footer>
        <p>© 2024 TicketChain. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AppMock;