// PrivacyModal.js
import React from 'react';

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Privacy & Analysis Information</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Data Privacy</h3>
              <p className="mb-2">Bank Statement Analyzer prioritizes your privacy and security:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Your bank statement is processed <strong>entirely within your browser</strong></li>
                <li>No data is ever sent to our servers or any third parties</li>
                <li>No user data is stored, collected, or logged</li>
                <li>Your session data exists only in your browser's temporary memory</li>
                <li>When you close the browser tab, all data is permanently deleted</li>
                <li>The application uses no cookies or tracking mechanisms</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-amber-700 mb-2">Analysis Limitations</h3>
              <p className="mb-2">While we strive for accuracy, automated financial analysis has inherent limitations:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Transaction categorization is based on keyword matching and may not always be accurate</li>
                <li>Date parsing may vary depending on regional formats in your statement</li>
                <li>Some transactions may be misclassified due to ambiguous descriptions</li>
                <li>Recurring transaction detection is an estimation and may include false positives</li>
                <li>Analysis quality depends on the format and consistency of your bank statement</li>
                <li>Different banks use different formats, which may affect parsing accuracy</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-purple-700 mb-2">Disclaimer</h3>
              <p className="mb-2">Please be aware of the following important information:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>This tool is provided "as is" without warranty of any kind</li>
                <li>Bank Statement Analyzer is not affiliated with any financial institution</li>
                <li>The analysis results should not be the sole basis for financial decisions</li>
                <li>This tool is not a substitute for professional financial advice</li>
                <li>Always verify the analysis results against your original statements</li>
                <li>The application developers are not responsible for any decisions made based on the analysis</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Best Practices</h3>
              <p className="mb-2">To get the most accurate results:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Use statements directly downloaded from your bank's official website</li>
                <li>Verify that your statement contains clear transaction descriptions</li>
                <li>Check that dates, amounts, and transaction types are properly formatted</li>
                <li>Review the categorization results and adjust as needed</li>
                <li>Consider the insights as a starting point for your financial analysis</li>
              </ul>
            </section>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;