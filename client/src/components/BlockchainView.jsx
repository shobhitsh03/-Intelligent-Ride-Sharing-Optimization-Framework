import { useState } from 'react';
import { Link, Shield, CheckCircle, AlertTriangle, ChevronRight, Hash, Clock, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlockchainView({ blocks, type = 'rides' }) {
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const toggleBlock = (index) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBlocks(newExpanded);
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);

    // Simulate verification (in real app, this would call backend)
    setTimeout(() => {
      // Simple local verification
      let valid = true;
      let message = 'Blockchain is valid and intact';

      for (let i = 1; i < blocks.length; i++) {
        const current = blocks[i];
        const previous = blocks[i - 1];

        if (current.previousHash !== previous.blockHash) {
          valid = false;
          message = `Chain broken at block ${current.blockIndex}`;
          break;
        }
      }

      setVerificationResult({ valid, message });
      setVerifying(false);
    }, 1000);
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return hash.slice(0, 12) + '...' + hash.slice(-4);
  };

  const getBlockColor = (index) => {
    if (index === 0) return 'from-purple-500 to-purple-700'; // Genesis
    return 'from-blue-500 to-blue-700'; // Regular
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <Box size={48} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
        <div className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>No blocks yet</div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          {type === 'rides' ? 'Create your first ride to start the blockchain' : 'Book a ride to start the blockchain'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Verification Header */}
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <Shield size={20} style={{ color: '#6366F1' }} />
          </div>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>Blockchain Integrity</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{blocks.length} blocks in chain</div>
          </div>
        </div>
        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          style={{ background: '#6366F1' }}
        >
          {verifying ? 'Verifying...' : 'Verify Chain'}
        </button>
      </div>

      {/* Verification Result */}
      <AnimatePresence>
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              verificationResult.valid ? 'bg-green-50' : 'bg-red-50'
            }`}
            style={{
              border: verificationResult.valid ? '1px solid #10B981' : '1px solid #EF4444'
            }}
          >
            {verificationResult.valid ? (
              <CheckCircle size={20} style={{ color: '#10B981' }} />
            ) : (
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
            )}
            <span className={`text-sm font-medium ${
              verificationResult.valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {verificationResult.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blockchain Visualization */}
      <div className="space-y-3">
        {blocks.slice().reverse().map((block, idx) => {
          const actualIndex = blocks.length - 1 - idx;
          const isExpanded = expandedBlocks.has(actualIndex);

          return (
            <motion.div
              key={block._id || actualIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {/* Block Card */}
              <div
                className="rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                {/* Block Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => toggleBlock(actualIndex)}
                  style={{
                    background: `linear-gradient(135deg, ${getBlockColor(block.blockIndex)})`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Box size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        Block #{block.blockIndex} {block.blockIndex === 0 && '(Genesis)'}
                      </div>
                      <div className="text-white/70 text-xs">
                        {type === 'rides' ? 'Ride' : 'Booking'} • {new Date(block.blockTimestamp || block.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>

                {/* Block Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3" style={{ background: 'var(--bg)' }}>
                        {/* Hash Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Hash size={14} style={{ color: 'var(--brand)' }} />
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>Block Hash</div>
                            </div>
                            <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                              {formatHash(block.blockHash)}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Link size={14} style={{ color: 'var(--brand)' }} />
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>Previous Hash</div>
                            </div>
                            <div className="text-xs font-mono" style={{ color: 'var(--text)' }}>
                              {formatHash(block.previousHash)}
                            </div>
                          </div>
                        </div>

                        {/* Transaction Data */}
                        <div className="p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Box size={14} style={{ color: 'var(--brand)' }} />
                            <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                              {type === 'rides' ? 'Ride Data' : 'Booking Data'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {type === 'rides' ? (
                              <>
                                <div style={{ color: 'var(--muted)' }}>From:</div>
                                <div style={{ color: 'var(--text)' }}>{block.source}</div>
                                <div style={{ color: 'var(--muted)' }}>To:</div>
                                <div style={{ color: 'var(--text)' }}>{block.destination}</div>
                                <div style={{ color: 'var(--muted)' }}>Fare:</div>
                                <div style={{ color: 'var(--text)' }}>₹{block.fare}</div>
                                <div style={{ color: 'var(--muted)' }}>Seats:</div>
                                <div style={{ color: 'var(--text)' }}>{block.availableSeats}</div>
                              </>
                            ) : (
                              <>
                                <div style={{ color: 'var(--muted)' }}>Seats:</div>
                                <div style={{ color: 'var(--text)' }}>{block.seats}</div>
                                <div style={{ color: 'var(--muted)' }}>Amount:</div>
                                <div style={{ color: 'var(--text)' }}>₹{block.amount}</div>
                                <div style={{ color: 'var(--muted)' }}>Status:</div>
                                <div style={{ color: 'var(--text)' }}>{block.status}</div>
                                <div style={{ color: 'var(--muted)' }}>Payment:</div>
                                <div style={{ color: 'var(--text)' }}>{block.paymentProvider}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Full Hash (Copyable) */}
                        <div className="p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <div className="flex items-center justify-between">
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>Full Hash:</div>
                            <button
                              onClick={() => navigator.clipboard.writeText(block.blockHash)}
                              className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-white/80 transition-colors"
                              style={{ color: 'var(--text)' }}
                            >
                              Copy
                            </button>
                          </div>
                          <div className="text-xs font-mono mt-1 break-all" style={{ color: 'var(--text)' }}>
                            {block.blockHash}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chain Link */}
              {idx < blocks.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-0.5 h-6" style={{ background: 'linear-gradient(to bottom, #6366F1, transparent)' }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
