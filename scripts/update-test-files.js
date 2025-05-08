#!/usr/bin/env node

/**
 * This script updates all test files to match the new contract interfaces
 * after refactoring the TicketNFT contract to fix stack too deep errors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all test files
const testDir = path.join(__dirname, '..', 'test');
const testFiles = [];

function findTestFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath);
    } else if (file.endsWith('.test.ts') && file !== 'TicketNFT.cov.test.ts') {
      testFiles.push(filePath);
    }
  }
}

findTestFiles(testDir);
console.log(`Found ${testFiles.length} test files to update`);

// Process each file
let totalChanges = 0;

for (const file of testFiles) {
  console.log(`\nProcessing ${path.basename(file)}...`);
  let content = fs.readFileSync(file, 'utf8');
  let changes = 0;
  
  // Pattern 1: Find and update mintTicket calls with object literal
  // Example: ticketNFT.connect(minter).mintTicket(buyer.address, 1, { eventId: 1, price: ..., ... })
  const objectLiteralPattern = /(ticketNFT\.connect\([^)]+\)\.mintTicket\()([^,]+),\s*([^,]+),\s*\{\s*eventId:\s*([^,]+),\s*price:\s*([^,]+),\s*validFrom:\s*([^,]+),\s*validUntil:\s*([^,]+),\s*isTransferable:\s*([^}]+)\s*\}\s*\)/g;
  
  content = content.replace(objectLiteralPattern, (match, prefix, to, tokenId, eventId, price, validFrom, validUntil, isTransferable) => {
    changes++;
    return `${prefix}${to}, ${tokenId}, ${eventId}, ${price}, ${validFrom}, ${validUntil}, ${isTransferable})`;
  });
  
  // Pattern 2: Find and update mintTicket calls with variables
  // Example: ticketNFT.connect(minter).mintTicket(buyer.address, 1, ticketMetadata)
  content = content.replace(/(const|let)\s+(\w+)\s*=\s*\{\s*eventId:\s*([^,]+),\s*price:\s*([^,]+),\s*validFrom:\s*([^,]+),\s*validUntil:\s*([^,]+),\s*isTransferable:\s*([^}]+)\s*\};([\s\S]*?)\.mintTicket\(([^,]+),\s*([^,]+),\s*\2\)/g, 
    (match, varType, varName, eventId, price, validFrom, validUntil, isTransferable, middle, to, tokenId) => {
      changes++;
      return `${varType} ${varName} = {\n  eventId: ${eventId},\n  price: ${price},\n  validFrom: ${validFrom},\n  validUntil: ${validUntil},\n  isTransferable: ${isTransferable}\n};${middle}.mintTicket(${to}, ${tokenId}, ${varName}.eventId, ${varName}.price, ${varName}.validFrom, ${varName}.validUntil, ${varName}.isTransferable)`;
    }
  );
  
  // Pattern 3: Find expect statements with mintTicket using variables
  content = content.replace(/(expect\(\s*ticketNFT\.connect\([^)]+\)\.mintTicket\()([^,]+),\s*([^,]+),\s*(\w+)(\)\s*\.[^;]+;)/g, 
    (match, prefix, to, tokenId, varName, suffix) => {
      changes++;
      return `${prefix}${to}, ${tokenId}, ${varName}.eventId, ${varName}.price, ${varName}.validFrom, ${varName}.validUntil, ${varName}.isTransferable${suffix}`;
    }
  );

  if (changes > 0) {
    console.log(`  Made ${changes} changes to mintTicket calls`);
    fs.writeFileSync(file, content);
    totalChanges += changes;
  } else {
    console.log(`  No changes needed`);
  }
}

console.log(`\nTotal changes across all files: ${totalChanges}`);

// Install the TypeChain types to make sure TypeScript recognizes the refactored contract
console.log('\nRegenerating TypeChain types...');
try {
  execSync('cd ' + path.join(__dirname, '..') + ' && pnpm hardhat typechain', { stdio: 'inherit' });
  console.log('TypeChain types regenerated successfully!');
} catch (error) {
  console.error('Error regenerating TypeChain types:', error);
}

// Run regular tests (not coverage tests) to verify changes
console.log('\nRunning tests to verify changes...');
try {
  execSync('cd ' + path.join(__dirname, '..') + ' && pnpm test', { stdio: 'inherit' });
  console.log('\n✅ Tests ran successfully!');
} catch (error) {
  console.error('\n❌ Tests still failing. Manual updates may be needed.');
  console.error('Error details:', error.message);
}
