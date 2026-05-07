import { useState } from 'react';
import { Download, X, CheckCircle, Calendar, MapPin, Car, CreditCard, User, Phone, Mail, Share2, Shield, Hash, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RideReceipt({ booking, ride, driver, onClose, onDownload, onShare }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    if (onDownload) {
      await onDownload();
    }
    setIsDownloading(false);
  };

  const handleShare = async () => {
    if (onShare) {
      await onShare();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={32} />
              <div>
                <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                <p className="text-sm opacity-90">Receipt #{booking?._id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Ride Details */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Car size={18} />
              Ride Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">From:</span>
                <span className="font-medium">{ride?.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium">{ride?.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {ride?.time ? new Date(ride.time).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {ride?.time ? new Date(ride.time).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-medium">{booking?.seats || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{ride?.vehicle} {ride?.subtype ? `(${ride.subtype})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User size={18} />
              Driver Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{driver?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{driver?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{ride?.plate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard size={18} />
              Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fare:</span>
                <span className="font-medium">₹{booking?.amount || ride?.fare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{booking?.paymentProvider || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  booking?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {booking?.status ? booking.status.toUpperCase() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium font-mono">{booking?._id?.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Booking Date */}
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Booked On:</span>
              <span className="font-medium">
                {booking?.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Blockchain Verification */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-purple-600" />
              <h3 className="font-semibold text-gray-800">Blockchain Verification</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Block Index:</span>
                <span className="font-medium">#{booking?.blockIndex || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Block Hash:</span>
                <span className="font-medium font-mono text-xs text-purple-600 break-all max-w-[200px]">
                  {booking?.blockHash || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Previous Hash:</span>
                <span className="font-medium font-mono text-xs text-gray-500 break-all max-w-[200px]">
                  {booking?.previousHash?.slice(0, 16) || 'N/A'}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timestamp:</span>
                <span className="font-medium text-xs">
                  {booking?.blockTimestamp ? new Date(booking.blockTimestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <CheckCircle size={12} />
                <span>This receipt is cryptographically verified on the blockchain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <Download size={20} />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <Share2 size={20} />
            Share
          </button>
        </div>
      </motion.div>
    </div>
  );
}
