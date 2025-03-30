// PrivacyNotice.js (Updated)
import React, { useState } from 'react';
import PrivacyModal from './PrivacyModal';

const PrivacyNotice = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(true);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-4 mb-8">
        {/* Privacy Notice */}
        {isPrivacyOpen && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow">
            <div className="flex justify-between">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Privacy Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Your privacy is important to us. Please note:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Your bank statement is processed <strong>entirely in your browser</strong></li>
                      <li>Your financial data is <strong>never sent to any server</strong></li>
                      <li>No data is stored or persisted after you close this page</li>
                      <li>Analysis results remain private to your current session</li>
                    </ul>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="flex-shrink-0 text-blue-500 hover:text-blue-700"
                title="Dismiss"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer Notice */}
        {isDisclaimerOpen && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow">
            <div className="flex justify-between">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Important Disclaimer</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>Please be aware of the following limitations:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>The accuracy of analysis depends on the format and quality of your bank statement</li>
                      <li>This tool uses automated categorization which may misclassify some transactions</li>
                      <li>Results should be verified and should not be the sole basis for financial decisions</li>
                      <li>This tool is not a substitute for professional financial advice</li>
                    </ul>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-amber-600 hover:text-amber-800 font-medium underline"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDisclaimerOpen(false)}
                className="flex-shrink-0 text-amber-500 hover:text-amber-700"
                title="Dismiss"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy & Disclaimer Modal */}
      <PrivacyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default PrivacyNotice;