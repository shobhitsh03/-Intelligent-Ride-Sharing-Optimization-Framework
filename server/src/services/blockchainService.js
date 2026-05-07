import crypto from 'crypto';

/**
 * Blockchain Service - Creates a tamper-evident ledger for rides and bookings
 * Uses SHA-256 hashing to link records in a chain
 */

/**
 * Calculate SHA-256 hash of data
 * @param {string} data - Stringified data to hash
 * @returns {string} - Hex hash
 */
function calculateHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate block hash for a ride or booking
 * @param {Object} data - The ride/booking data
 * @param {string} previousHash - Hash of the previous block
 * @param {number} index - Block index in the chain
 * @returns {string} - Block hash
 */
function generateBlockHash(data, previousHash, index) {
  const blockString = JSON.stringify({
    data,
    previousHash,
    index,
    timestamp: Date.now()
  });
  return calculateHash(blockString);
}

/**
 * Create genesis block (first block in the chain)
 * @param {Object} data - Initial data
 * @returns {Object} - Genesis block
 */
function createGenesisBlock(data) {
  const index = 0;
  const previousHash = '0'; // Genesis block has no previous hash
  const blockHash = generateBlockHash(data, previousHash, index);
  
  return {
    index,
    data,
    previousHash,
    blockHash,
    timestamp: Date.now()
  };
}

/**
 * Create a new block in the chain
 * @param {Object} data - Block data
 * @param {string} previousHash - Hash of the previous block
 * @param {number} index - Block index
 * @returns {Object} - New block
 */
function createBlock(data, previousHash, index) {
  const blockHash = generateBlockHash(data, previousHash, index);
  
  return {
    index,
    data,
    previousHash,
    blockHash,
    timestamp: Date.now()
  };
}

/**
 * Verify block chain integrity
 * @param {Array} blocks - Array of blocks to verify
 * @returns {Object} - Verification result
 */
function verifyChain(blocks) {
  if (!blocks || blocks.length === 0) {
    return { valid: true, message: 'No blocks to verify' };
  }

  // Verify genesis block
  const genesisBlock = blocks[0];
  if (genesisBlock.previousHash !== '0') {
    return { valid: false, message: 'Genesis block has invalid previous hash', blockIndex: 0 };
  }

  // Verify each block
  for (let i = 1; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const previousBlock = blocks[i - 1];

    // Check previous hash reference
    if (currentBlock.previousHash !== previousBlock.blockHash) {
      return { 
        valid: false, 
        message: 'Block chain broken: previous hash mismatch', 
        blockIndex: i 
      };
    }

    // Recalculate and verify current block hash
    const calculatedHash = generateBlockHash(
      currentBlock.data,
      currentBlock.previousHash,
      currentBlock.index
    );

    if (calculatedHash !== currentBlock.blockHash) {
      return { 
        valid: false, 
        message: 'Block data has been tampered with', 
        blockIndex: i 
      };
    }
  }

  return { valid: true, message: 'Blockchain is valid and intact' };
}

/**
 * Prepare ride data for hashing
 * @param {Object} ride - Ride document
 * @returns {Object} - Hashable data
 */
function prepareRideData(ride) {
  return {
    source: ride.source,
    destination: ride.destination,
    sourceLoc: ride.sourceLoc,
    destLoc: ride.destLoc,
    time: ride.time,
    fare: ride.fare,
    availableSeats: ride.availableSeats,
    driver: ride.driver,
    vehicle: ride.vehicle,
    plate: ride.plate,
    status: ride.status
  };
}

/**
 * Prepare booking data for hashing
 * @param {Object} booking - Booking document
 * @returns {Object} - Hashable data
 */
function prepareBookingData(booking) {
  return {
    ride: booking.ride,
    rider: booking.rider,
    seats: booking.seats,
    amount: booking.amount,
    paymentProvider: booking.paymentProvider,
    status: booking.status
  };
}

export {
  calculateHash,
  generateBlockHash,
  createGenesisBlock,
  createBlock,
  verifyChain,
  prepareRideData,
  prepareBookingData
};
