import React, { useState } from 'react';
import styled from 'styled-components';
import { WalletConnection } from './components/WalletConnection';
import { TicketDisplay } from './components/TicketDisplay';
import { ITicketMetadata } from './interfaces/ITicketMetadata';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
`;

const App: React.FC = () => {
  // Sample ticket data for demonstration
  const [sampleTicket] = useState<ITicketMetadata>({
    eventId: 1,
    eventName: 'Blockchain Conference 2024',
    location: 'San Francisco, CA',
    price: '0.1',
    validFrom: Math.floor(Date.now() / 1000),
    validUntil: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
    isTransferable: true,
    tier: 'VIP'
  });

  // Simulated ticket validity check
  const [isTicketValid] = useState(true);

  return (
    <AppContainer>
      <Header>
        <Title>TicketChain</Title>
        <WalletConnection />
      </Header>
      
      <main>
        <h2>Sample Ticket</h2>
        <TicketDisplay 
          ticket={sampleTicket} 
          isValid={isTicketValid} 
        />
      </main>
    </AppContainer>
  );
};

export default App;
