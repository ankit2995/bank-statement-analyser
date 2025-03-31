import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyNotice = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    // Check if the notice has been dismissed before
    const isDismissed = localStorage.getItem('privacyNoticeDismissed') === 'true';
    
    if (!isDismissed) {
      // Show the privacy notice after 15 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 15000);
      
      // Clean up the timer if component unmounts
      return () => clearTimeout(timer);
    }
  }, []);

  const closeNotice = () => {
    setIsOpen(false);
    // Save to localStorage to avoid showing again in same session
    localStorage.setItem('privacyNoticeDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cyber-container p-6 rounded-xl shadow-xl backdrop-blur-xl bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-blue-400/30">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              {/* Header with icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="mr-3 bg-blue-500/20 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Your Data is Safe With Us! 🛡️</h3>
                </div>
                <button 
                  onClick={closeNotice}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Main content */}
              <div>
                <p className="text-white/90 text-sm mb-3">
                  <span className="font-semibold text-blue-300">
                    We're not spying on your money! 👀
                  </span> Your bank statement data is processed entirely in your browser and never reaches our servers.
                </p>
                
                {isExpanded && (
                  <div className="text-white/80 text-sm space-y-2 mb-4">
                    <p>
                      We use client-side JavaScript to analyze your financial data, which means:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your data never leaves your device</li>
                      <li>Nothing is stored on our servers</li>
                      <li>No one else can see your financial information</li>
                      <li>Refresh the page and all data is gone</li>
                    </ul>
                    <div className="flex items-center mt-3 pt-2 border-t border-white/10">
                      <svg className="w-4 h-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-400 text-xs font-medium">
                        Your money secrets stay secret! We're all about privacy. 🔐
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-400 hover:text-blue-300 text-sm underline focus:outline-none transition-colors flex items-center"
                >
                  {isExpanded ? (
                    <>
                      <span>Show less</span>
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Tell me more</span>
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
                <button
                  onClick={closeNotice}
                  className="cyber-button px-4 py-2 text-sm text-white rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none"
                >
                  <span className="flex items-center">
                    <span className="mr-1">Got it!</span>
                    <span className="text-lg">✨</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyNotice;