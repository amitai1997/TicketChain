// Frontend for interacting with the TicketChain contract
console.log("TicketChain app loading...");

// Check if ethers is properly loaded
if (typeof ethers === 'undefined') {
    console.error("ERROR: ethers.js library not found!");
    alert("Web3 library not loaded. Please refresh the page or check your internet connection.");
} else {
    console.log("ethers.js loaded successfully:", ethers.version);
}

// Contract address - update this with your deployed contract address
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
console.log("Using contract address:", contractAddress);

// Contract ABI - simplified for clarity
const contractABI = [
    // Basic ERC721 functions
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
    {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    
    // Event related functions
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"eventId","type":"uint256"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"uint256","name":"ticketPrice","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"maxTickets","type":"uint256"}],"name":"EventCreated","type":"event"},
    {"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"ticketPrice","type":"uint256"},{"internalType":"uint256","name":"maxTickets","type":"uint256"},{"internalType":"uint256","name":"eventDate","type":"uint256"},{"internalType":"uint256","name":"minResalePrice","type":"uint256"},{"internalType":"uint256","name":"maxResalePrice","type":"uint256"},{"internalType":"uint256","name":"royaltyPercentage","type":"uint256"}],"name":"createEvent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"eventId","type":"uint256"}],"name":"getEvent","outputs":[{"components":[{"internalType":"uint256","name":"eventId","type":"uint256"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"ticketPrice","type":"uint256"},{"internalType":"uint256","name":"maxTickets","type":"uint256"},{"internalType":"uint256","name":"ticketsSold","type":"uint256"},{"internalType":"uint256","name":"eventDate","type":"uint256"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"address","name":"organizer","type":"address"},{"internalType":"uint256","name":"minResalePrice","type":"uint256"},{"internalType":"uint256","name":"maxResalePrice","type":"uint256"},{"internalType":"uint256","name":"royaltyPercentage","type":"uint256"}],"internalType":"struct TicketNFT.Event","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getEventCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"eventId","type":"uint256"}],"name":"cancelEvent","outputs":[],"stateMutability":"nonpayable","type":"function"},
    
    // Ticket related functions
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"eventId","type":"uint256"},{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"TicketMinted","type":"event"},
    {"inputs":[{"internalType":"uint256","name":"eventId","type":"uint256"},{"internalType":"string","name":"metadataURI","type":"string"}],"name":"mintTicket","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"isTicketValid","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    
    // Resale related functions
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"TicketListed","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"price","type":"uint256"}],"name":"TicketSold","type":"event"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"}],"name":"listTicketForResale","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"buyResaleTicket","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"cancelResaleListing","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ticketResalePrices","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ticketToEvent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Get DOM elements
console.log("Initializing DOM elements");
const connectButton = document.getElementById("connect");
const createEventForm = document.getElementById("createEventForm");
const eventsList = document.getElementById("eventsList");
const ticketsList = document.getElementById("ticketsList");
const mintTicketForm = document.getElementById("mintTicketForm");
const resaleTicketForm = document.getElementById("resaleTicketForm");
const buyTicketForm = document.getElementById("buyTicketForm");

// Global variables
let provider;
let signer;
let contract;
let userAddress;

// Connect to wallet and contract
async function connect() {
    try {
        console.log("Connecting to wallet...");
        
        // Check for Ethereum provider
        if (!window.ethereum) {
            throw new Error("No Ethereum provider found. Please install MetaMask.");
        }
        
        // Connect to provider
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // Get signer and address
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        console.log("Connected to wallet:", userAddress);
        
        // Update UI
        document.getElementById("walletAddress").textContent = userAddress;
        document.getElementById("connectionStatus").textContent = "Connected";
        
        // Connect to contract
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        console.log("Contract connected");
        
        // Try to get event count to verify connection
        try {
            const eventCount = await contract.getEventCount();
            console.log("Current event count:", eventCount.toString());
        } catch (contractError) {
            console.error("Error connecting to contract:", contractError);
            alert("Connected to wallet but couldn't interact with the contract. Please check if the contract is deployed at " + contractAddress);
            return;
        }
        
        // Load data
        loadEvents();
        // Use super-simplified ticket loader
        simplifiedTicketCheck();
        
        // Show forms
        if (createEventForm) createEventForm.style.display = "block";
        
    } catch (error) {
        console.error("Connection error:", error);
        alert("Error connecting to wallet: " + error.message);
    }
}

// Very simple ticket check
async function simplifiedTicketCheck() {
    try {
        // Clear tickets list and show loading message
        ticketsList.innerHTML = "<p>Checking for tickets...</p>";
        
        if (!userAddress) {
            ticketsList.innerHTML = "<p>Connect your wallet to see tickets.</p>";
            return;
        }
        
        // Just check the balance - simplest approach
        const balance = await contract.balanceOf(userAddress);
        console.log("Balance check complete. User has", balance.toString(), "tickets");
        
        if (balance.toNumber() === 0) {
            ticketsList.innerHTML = "<p>You don't own any tickets yet.</p>";
        } else {
            ticketsList.innerHTML = `
                <p>You own ${balance.toString()} ticket(s)!</p>
                <p>After purchasing a ticket, it may take a few moments to appear.</p>
                <button onclick="simplifiedTicketCheck()">Refresh Ticket Count</button>
            `;
        }
    } catch (error) {
        console.error("Error checking tickets:", error);
        ticketsList.innerHTML = `
            <p>Error checking ticket balance: ${error.message}</p>
            <button onclick="simplifiedTicketCheck()">Try Again</button>
        `;
    }
}

// Load events
async function loadEvents() {
    try {
        console.log("Loading events...");
        
        // Clear events list
        eventsList.innerHTML = "";
        
        // Get event count
        const eventCount = await contract.getEventCount();
        console.log("Found", eventCount.toString(), "events");
        
        if (eventCount.toNumber() === 0) {
            eventsList.innerHTML = "<p>No events available. Create your first event!</p>";
            return;
        }
        
        // Load each event
        for (let i = 1; i <= eventCount; i++) {
            const event = await contract.getEvent(i);
            
            if (event.isActive) {
                const eventElement = document.createElement("div");
                eventElement.className = "event-item";
                
                const date = new Date(event.eventDate.toNumber() * 1000);
                const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                
                eventElement.innerHTML = `
                    <h3>${event.name}</h3>
                    <p>${event.description}</p>
                    <p>Date: ${formattedDate}</p>
                    <p>Price: ${ethers.utils.formatEther(event.ticketPrice)} ETH</p>
                    <p>Available: ${event.maxTickets.toNumber() - event.ticketsSold.toNumber()} / ${event.maxTickets.toNumber()}</p>
                    <p>Event ID: ${event.eventId}</p>
                    <button onclick="prepareTicketMint(${event.eventId}, '${event.name}', '${event.ticketPrice}')">Buy Ticket</button>
                `;
                
                eventsList.appendChild(eventElement);
            }
        }
        
        if (eventsList.children.length === 0) {
            eventsList.innerHTML = "<p>No active events available.</p>";
        }
    } catch (error) {
        console.error("Error loading events:", error);
        eventsList.innerHTML = "<p>Error loading events. Please try again.</p>";
    }
}

// Prepare ticket mint form
function prepareTicketMint(eventId, eventName, price) {
    console.log("Preparing to mint ticket for event", eventId);
    
    document.getElementById("mintEventId").value = eventId;
    document.getElementById("mintEventName").textContent = eventName;
    document.getElementById("mintPrice").textContent = ethers.utils.formatEther(price);
    
    // Show form
    document.getElementById("mintTicketFormContainer").style.display = "block";
}

// Mint a new ticket
async function mintTicket(event) {
    event.preventDefault();
    
    const eventId = document.getElementById("mintEventId").value;
    const metadataURI = document.getElementById("metadataURI").value || `ipfs://ticket-metadata-${Date.now()}`;
    
    try {
        console.log("Minting ticket for event", eventId);
        
        // Get event price
        const eventInfo = await contract.getEvent(eventId);
        
        // Update status
        document.getElementById("mintStatus").textContent = "Sending transaction...";
        
        // Send transaction
        const tx = await contract.mintTicket(eventId, metadataURI, {
            value: eventInfo.ticketPrice
        });
        
        document.getElementById("mintStatus").textContent = "Transaction sent: " + tx.hash;
        console.log("Mint transaction sent:", tx.hash);
        
        // Wait for confirmation
        await tx.wait();
        document.getElementById("mintStatus").textContent = "Ticket minted successfully!";
        
        // Update UI
        loadEvents();
        
        // Wait a bit and check tickets again
        setTimeout(() => {
            simplifiedTicketCheck();
        }, 3000);
        
        // Hide form after a delay
        setTimeout(() => {
            document.getElementById("mintTicketFormContainer").style.display = "none";
        }, 3000);
    } catch (error) {
        console.error("Error minting ticket:", error);
        document.getElementById("mintStatus").textContent = "Error: " + error.message;
    }
}

// Prepare resale listing form
function prepareResaleListing(tokenId) {
    console.log("Preparing to resell ticket", tokenId);
    
    document.getElementById("resaleTokenId").value = tokenId;
    
    // Show form
    document.getElementById("resaleTicketFormContainer").style.display = "block";
}

// List ticket for resale
async function listTicketForResale(event) {
    event.preventDefault();
    
    const tokenId = document.getElementById("resaleTokenId").value;
    const price = ethers.utils.parseEther(document.getElementById("resalePrice").value);
    
    try {
        console.log("Listing ticket", tokenId, "for resale at", ethers.utils.formatEther(price), "ETH");
        
        // Update status
        document.getElementById("resaleStatus").textContent = "Sending transaction...";
        
        // Send transaction
        const tx = await contract.listTicketForResale(tokenId, price);
        
        document.getElementById("resaleStatus").textContent = "Transaction sent: " + tx.hash;
        
        // Wait for confirmation
        await tx.wait();
        document.getElementById("resaleStatus").textContent = "Ticket listed for resale successfully!";
        
        // Update UI
        simplifiedTicketCheck();
        
        // Hide form after a delay
        setTimeout(() => {
            document.getElementById("resaleTicketFormContainer").style.display = "none";
        }, 3000);
    } catch (error) {
        console.error("Error listing ticket for resale:", error);
        document.getElementById("resaleStatus").textContent = "Error: " + error.message;
    }
}

// Cancel resale listing
async function cancelResaleListing(tokenId) {
    try {
        console.log("Cancelling resale listing for ticket", tokenId);
        
        // Send transaction
        const tx = await contract.cancelResaleListing(tokenId);
        
        // Wait for confirmation
        await tx.wait();
        alert("Resale listing cancelled successfully!");
        
        // Update UI
        simplifiedTicketCheck();
    } catch (error) {
        console.error("Error cancelling resale listing:", error);
        alert("Error cancelling resale listing: " + error.message);
    }
}

// Buy a resale ticket
async function buyResaleTicket(event) {
    event.preventDefault();
    
    const tokenId = document.getElementById("buyTokenId").value;
    
    try {
        console.log("Checking resale price for ticket", tokenId);
        
        // Update status
        document.getElementById("buyStatus").textContent = "Checking ticket...";
        
        // Get resale price
        const resalePrice = await contract.ticketResalePrices(tokenId);
        
        if (resalePrice.eq(0)) {
            throw new Error("Ticket is not for sale");
        }
        
        console.log("Buying ticket", tokenId, "for", ethers.utils.formatEther(resalePrice), "ETH");
        document.getElementById("buyStatus").textContent = "Sending transaction...";
        
        // Send transaction
        const tx = await contract.buyResaleTicket(tokenId, {
            value: resalePrice
        });
        
        document.getElementById("buyStatus").textContent = "Transaction sent: " + tx.hash;
        
        // Wait for confirmation
        await tx.wait();
        document.getElementById("buyStatus").textContent = "Ticket purchased successfully!";
        
        // Update UI
        simplifiedTicketCheck();
        
        // Hide form after a delay
        setTimeout(() => {
            document.getElementById("buyTicketFormContainer").style.display = "none";
        }, 3000);
    } catch (error) {
        console.error("Error buying resale ticket:", error);
        document.getElementById("buyStatus").textContent = "Error: " + error.message;
    }
}

// Create a new event
async function createEvent(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById("eventName").value;
    const description = document.getElementById("eventDescription").value;
    const ticketPrice = ethers.utils.parseEther(document.getElementById("eventTicketPrice").value);
    const maxTickets = document.getElementById("eventMaxTickets").value;
    
    const eventDateString = document.getElementById("eventDate").value;
    const eventTimeString = document.getElementById("eventTime").value;
    const eventDateTime = new Date(eventDateString + "T" + eventTimeString);
    const eventDate = Math.floor(eventDateTime.getTime() / 1000);
    
    const minResalePrice = ethers.utils.parseEther(document.getElementById("eventMinResalePrice").value);
    const maxResalePrice = ethers.utils.parseEther(document.getElementById("eventMaxResalePrice").value);
    const royaltyPercentage = document.getElementById("eventRoyaltyPercentage").value * 100; // Convert to basis points
    
    try {
        console.log("Creating new event:", name);
        console.log("Parameters:", {
            ticketPrice: ethers.utils.formatEther(ticketPrice) + " ETH",
            maxTickets,
            eventDate: new Date(eventDate * 1000).toLocaleString(),
            minResalePrice: ethers.utils.formatEther(minResalePrice) + " ETH",
            maxResalePrice: ethers.utils.formatEther(maxResalePrice) + " ETH",
            royaltyPercentage: royaltyPercentage / 100 + "%"
        });
        
        // Update status
        document.getElementById("createEventStatus").textContent = "Sending transaction...";
        
        // Send transaction
        const tx = await contract.createEvent(
            name,
            description,
            ticketPrice,
            maxTickets,
            eventDate,
            minResalePrice,
            maxResalePrice,
            royaltyPercentage
        );
        
        document.getElementById("createEventStatus").textContent = "Transaction sent: " + tx.hash;
        
        // Wait for confirmation
        await tx.wait();
        document.getElementById("createEventStatus").textContent = "Event created successfully!";
        
        // Update UI
        loadEvents();
        
        // Reset form
        createEventForm.reset();
    } catch (error) {
        console.error("Error creating event:", error);
        document.getElementById("createEventStatus").textContent = "Error: " + error.message;
    }
}

// Make functions available globally
window.connect = connect;
window.prepareTicketMint = prepareTicketMint;
window.mintTicket = mintTicket;
window.prepareResaleListing = prepareResaleListing;
window.listTicketForResale = listTicketForResale;
window.cancelResaleListing = cancelResaleListing;
window.buyResaleTicket = buyResaleTicket;
window.createEvent = createEvent;
window.simplifiedTicketCheck = simplifiedTicketCheck;

// Set up event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded");
    
    // Connect wallet button
    if (connectButton) {
        connectButton.addEventListener("click", connect);
        console.log("Connect button event listener added");
    }
    
    // Create event form
    if (createEventForm) {
        createEventForm.addEventListener("submit", createEvent);
        createEventForm.style.display = "none"; // Hide until connected
        console.log("Create event form listener added");
    }
    
    // Mint ticket form
    if (mintTicketForm) {
        mintTicketForm.addEventListener("submit", mintTicket);
        console.log("Mint ticket form listener added");
    }
    
    // Resale ticket form
    if (resaleTicketForm) {
        resaleTicketForm.addEventListener("submit", listTicketForResale);
        console.log("Resale ticket form listener added");
    }
    
    // Buy ticket form
    if (buyTicketForm) {
        buyTicketForm.addEventListener("submit", buyResaleTicket);
        console.log("Buy ticket form listener added");
    }
    
    // Auto-connect if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        console.log("Wallet already connected, initializing...");
        connect();
    }
    
    console.log("Initialization complete");
});
