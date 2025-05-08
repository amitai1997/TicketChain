import React from 'react';
import styled from 'styled-components';
import { ITicketMetadata } from '../interfaces/ITicketMetadata';

interface TicketDisplayProps {
  ticket: ITicketMetadata;
  isValid: boolean;
}

const TicketContainer = styled.div<{ isValid: boolean }>`
  border: 2px solid ${(props) => (props.isValid ? '#4CAF50' : '#F44336')};
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
  margin: 16px;
  background-color: ${(props) => (props.isValid ? '#E8F5E9' : '#FFEBEE')};
`;

const TicketHeader = styled.h2`
  color: #333;
  margin-bottom: 12px;
`;

const TicketDetail = styled.p`
  margin: 8px 0;
  font-size: 14px;
`;

const StatusBadge = styled.span<{ isValid: boolean }>`
  background-color: ${(props) => (props.isValid ? '#4CAF50' : '#F44336')};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
`;

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket, isValid }) => {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <TicketContainer isValid={isValid}>
      <TicketHeader>{ticket.eventName}</TicketHeader>
      <TicketDetail>Tier: {ticket.tier || 'General Admission'}</TicketDetail>
      <TicketDetail>Location: {ticket.location}</TicketDetail>
      <TicketDetail>Price: {ticket.price} MATIC</TicketDetail>
      <TicketDetail>Valid From: {formatDate(ticket.validFrom)}</TicketDetail>
      <TicketDetail>Valid Until: {formatDate(ticket.validUntil)}</TicketDetail>
      <StatusBadge isValid={isValid}>{isValid ? 'Valid' : 'Invalid'}</StatusBadge>
    </TicketContainer>
  );
};
