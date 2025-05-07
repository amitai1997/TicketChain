export interface ITicketMetadata {
  eventId: bigint;
  price: bigint;
  validFrom: bigint;
  validUntil: bigint;
  isTransferable: boolean;
}

export interface ITicket {
  id: bigint;
  owner: string;
  metadata: ITicketMetadata;
  isValid: boolean;
}
