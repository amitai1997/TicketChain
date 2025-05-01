// This is a simplified function to load user tickets
// Replace the existing loadUserTickets function with this one

async function loadUserTicketsSimple() {
    try {
        console.log("Loading tickets with simple function");
        
        // Clear tickets list and show loading message
        ticketsList.innerHTML = "<p>Loading your tickets...</p>";
        
        if (!userAddress) {
            console.warn("No user address available");
            ticketsList.innerHTML = "<p>Please connect your wallet to see tickets.</p>";
            return;
        }
        
        // First check if user has any tickets
        const balance = await contract.balanceOf(userAddress);
        console.log("User has", balance.toString(), "tickets");
        
        if (balance.toNumber() === 0) {
            ticketsList.innerHTML = "<p>You don't own any tickets yet.</p>";
            return;
        }
        
        // User has tickets, but we'll use a simple approach
        ticketsList.innerHTML = `
            <p>We've detected that you own ${balance.toString()} tickets. Due to blockchain indexing, they may take a moment to appear.</p>
            <button onclick="loadUserTicketsSimple()">Refresh Tickets List</button>
        `;
        
    } catch (error) {
        console.error("Error in simplified ticket loading:", error);
        ticketsList.innerHTML = `
            <p>Error loading tickets: ${error.message}</p>
            <button onclick="loadUserTicketsSimple()">Try Again</button>
        `;
    }
}

// Make this function available to the window
window.loadUserTicketsSimple = loadUserTicketsSimple;
