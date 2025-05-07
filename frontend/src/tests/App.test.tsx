import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppMock from './mocks/AppMock';

// Mock the useTicketNFT hook
vi.mock('../hooks/useTicketNFT', () => ({
  useTicketNFT: vi.fn().mockReturnValue({
    userTickets: [],
    isLoading: false,
    totalSupply: 0,
    nextTokenId: 1n,
    fetchUserTickets: vi.fn(),
    mintNewTicket: vi.fn(),
    transferTicketTo: vi.fn(),
    fetchTicketData: vi.fn(),
    contractAddress: '0x0000000000000000000000000000000000000000',
  }),
}));

describe('App', () => {
  it('renders TicketChain in the header', () => {
    render(
      <BrowserRouter>
        <AppMock />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/TicketChain/i);
  });

  it('renders footer', () => {
    render(
      <BrowserRouter>
        <AppMock />
      </BrowserRouter>
    );

    expect(screen.getByText(/© \d{4} TicketChain. All rights reserved\./i)).toBeInTheDocument();
  });
});
