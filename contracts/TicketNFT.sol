// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TicketNFT
 * @dev Contract for minting and managing ticket NFTs for events
 */
contract TicketNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Event details
    struct Event {
        uint256 eventId;
        string name;
        string description;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 eventDate;
        bool isActive;
        address organizer;
        uint256 minResalePrice;
        uint256 maxResalePrice;
        uint256 royaltyPercentage; // in basis points (100 = 1%)
    }
    
    // Mapping from eventId to Event
    mapping(uint256 => Event) public events;
    
    // Mapping from tokenId to eventId
    mapping(uint256 => uint256) public ticketToEvent;
    
    // Mapping from tokenId to resale price (0 if not for resale)
    mapping(uint256 => uint256) public ticketResalePrices;
    
    // Counter for event IDs
    Counters.Counter private _eventIds;
    
    // Events
    event EventCreated(uint256 eventId, string name, uint256 ticketPrice, uint256 maxTickets);
    event TicketMinted(uint256 tokenId, uint256 eventId, address owner);
    event TicketListed(uint256 tokenId, uint256 price);
    event TicketSold(uint256 tokenId, address from, address to, uint256 price);
    
    constructor() ERC721("TicketChain", "TIX") {}
    
    /**
     * @dev Create a new event
     * @param name Name of the event
     * @param description Description of the event
     * @param ticketPrice Price of each ticket in wei
     * @param maxTickets Maximum number of tickets available
     * @param eventDate Timestamp of when the event will occur
     * @param minResalePrice Minimum resale price in wei
     * @param maxResalePrice Maximum resale price in wei
     * @param royaltyPercentage Royalty percentage in basis points (100 = 1%)
     */
    function createEvent(
        string memory name,
        string memory description,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 eventDate,
        uint256 minResalePrice,
        uint256 maxResalePrice,
        uint256 royaltyPercentage
    ) public returns (uint256) {
        require(eventDate > block.timestamp, "Event date must be in the future");
        require(maxTickets > 0, "Max tickets must be greater than zero");
        require(royaltyPercentage <= 10000, "Royalty percentage cannot exceed 100%");
        require(minResalePrice <= maxResalePrice, "Min resale price must be <= max resale price");
        
        _eventIds.increment();
        uint256 newEventId = _eventIds.current();
        
        events[newEventId] = Event({
            eventId: newEventId,
            name: name,
            description: description,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            ticketsSold: 0,
            eventDate: eventDate,
            isActive: true,
            organizer: msg.sender,
            minResalePrice: minResalePrice,
            maxResalePrice: maxResalePrice,
            royaltyPercentage: royaltyPercentage
        });
        
        emit EventCreated(newEventId, name, ticketPrice, maxTickets);
        
        return newEventId;
    }
    
    /**
     * @dev Mint a new ticket NFT for an event
     * @param eventId ID of the event to mint a ticket for
     * @param metadataURI URI of the metadata for this ticket
     */
    function mintTicket(uint256 eventId, string memory metadataURI) public payable returns (uint256) {
        Event storage event_ = events[eventId];
        
        require(event_.isActive, "Event is not active");
        require(event_.ticketsSold < event_.maxTickets, "All tickets have been sold");
        require(msg.value >= event_.ticketPrice, "Insufficient payment");
        require(block.timestamp < event_.eventDate, "Event has already occurred");
        
        // Increment token ID
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint the NFT
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, metadataURI);
        
        // Associate ticket with event
        ticketToEvent[newTokenId] = eventId;
        
        // Update event details
        event_.ticketsSold += 1;
        
        // Transfer payment to the organizer
        payable(event_.organizer).transfer(msg.value); // Consider using 'call' instead of 'payable'
        
        emit TicketMinted(newTokenId, eventId, msg.sender);
        
        return newTokenId;
    }
    
    /**
     * @dev List a ticket for resale
     * @param tokenId ID of the ticket to list for resale
     * @param price Price in wei to sell the ticket for
     */
    function listTicketForResale(uint256 tokenId, uint256 price) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner of ticket");
        
        uint256 eventId = ticketToEvent[tokenId];
        Event storage event_ = events[eventId];
        
        require(event_.isActive, "Event is not active");
        require(block.timestamp < event_.eventDate, "Event has already occurred");
        require(price >= event_.minResalePrice, "Price below minimum resale price");
        require(price <= event_.maxResalePrice, "Price above maximum resale price");
        
        ticketResalePrices[tokenId] = price;
        
        emit TicketListed(tokenId, price);
    }
    
    /**
     * @dev Buy a ticket that's listed for resale
     * @param tokenId ID of the ticket to purchase
     */
    function buyResaleTicket(uint256 tokenId) public payable {
        uint256 price = ticketResalePrices[tokenId];
        require(price > 0, "Ticket not for sale");
        require(msg.value >= price, "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        uint256 eventId = ticketToEvent[tokenId];
        Event storage event_ = events[eventId];
        
        require(block.timestamp < event_.eventDate, "Event has already occurred");
        
        // Calculate royalty
        uint256 royaltyAmount = (price * event_.royaltyPercentage) / 10000;
        uint256 sellerProceeds = price - royaltyAmount;
        
        // Transfer ownership
        _transfer(seller, msg.sender, tokenId);
        
        // Reset resale price
        ticketResalePrices[tokenId] = 0;
        
        // Transfer payment to seller and royalty to organizer
        payable(seller).transfer(sellerProceeds);
        payable(event_.organizer).transfer(royaltyAmount);
        
        emit TicketSold(tokenId, seller, msg.sender, price);
    }
    
    /**
     * @dev Cancel resale listing
     * @param tokenId ID of the ticket to cancel listing
     */
    function cancelResaleListing(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner of ticket");
        require(ticketResalePrices[tokenId] > 0, "Ticket not listed for resale");
        
        ticketResalePrices[tokenId] = 0;
    }
    
    /**
     * @dev Cancel an event and allow refunds
     * @param eventId ID of the event to cancel
     */
    function cancelEvent(uint256 eventId) public {
        Event storage event_ = events[eventId];
        require(msg.sender == event_.organizer, "Only organizer can cancel");
        require(event_.isActive, "Event already cancelled");
        
        event_.isActive = false;
        // Refund implementation would be added here
    }
    
    /**
     * @dev Check if a ticket is valid for entry
     * @param tokenId ID of the ticket to validate
     * @return bool indicating if the ticket is valid
     */
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }
        
        uint256 eventId = ticketToEvent[tokenId];
        Event storage event_ = events[eventId];
        
        return (event_.isActive && block.timestamp <= event_.eventDate);
    }
    
    /**
     * @dev Get event details
     * @param eventId ID of the event
     * @return Event details
     */
    function getEvent(uint256 eventId) public view returns (Event memory) {
        return events[eventId];
    }
    
    /**
     * @dev Get total number of events
     * @return Total number of events
     */
    function getEventCount() public view returns (uint256) {
        return _eventIds.current();
    }
}
