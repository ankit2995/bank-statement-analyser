// PrivacyModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Privacy & Terms
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Privacy Notice */}
              <section className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Privacy Information
                </h3>
                <div className="text-blue-700 space-y-4">
                  <p>Your privacy is important to us. Please note:</p>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>Your bank statement is processed <strong>entirely in your browser</strong></li>
                    <li>Your financial data is <strong>never sent to any server</strong></li>
                    <li>No data is stored or persisted after you close this page</li>
                    <li>Analysis results remain private to your current session</li>
                    <li>The application uses no cookies or tracking mechanisms</li>
                    <li>When you close the browser tab, all data is permanently deleted</li>
                  </ul>
                </div>
              </section>

              {/* Disclaimer */}
              <section className="bg-amber-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Important Disclaimer
                </h3>
                <div className="text-amber-700 space-y-4">
                  <p>Please be aware of the following limitations:</p>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>The accuracy of analysis depends on the format and quality of your bank statement</li>
                    <li>This tool uses automated categorization which may misclassify some transactions</li>
                    <li>Results should be verified and should not be the sole basis for financial decisions</li>
                    <li>This tool is not a substitute for professional financial advice</li>
                    <li>Different banks use different formats, which may affect parsing accuracy</li>
                    <li>The application developers are not responsible for any decisions made based on the analysis</li>
                  </ul>
                </div>
              </section>

              {/* Best Practices */}
              <section className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Best Practices
                </h3>
                <div className="text-green-700 space-y-4">
                  <p>To get the most accurate results:</p>
                  <ul className="list-disc ml-5 space-y-2">
                    <li>Use statements directly downloaded from your bank's official website</li>
                    <li>Verify that your statement contains clear transaction descriptions</li>
                    <li>Check that dates, amounts, and transaction types are properly formatted</li>
                    <li>Review the categorization results and adjust as needed</li>
                    <li>Consider the insights as a starting point for your financial analysis</li>
                  </ul>
                </div>
              </section>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                I Understand
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyModal;