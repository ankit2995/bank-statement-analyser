import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const TransactionModal = ({ isOpen, onClose, category, transactions, type }) => {
  // Filter transactions for the selected category
  const filteredTransactions = transactions?.filter(t => 
    t.category === category?.name && 
    ((type === 'expense' && t.debit > 0) || 
     (type === 'income' && t.credit > 0))
  );
  
  // Calculate total for the category
  const categoryTotal = filteredTransactions?.reduce((sum, t) => 
    type === 'expense' ? sum + t.debit : sum + t.credit, 0);
    
  // Sort transactions by amount (highest first)
  const sortedTransactions = filteredTransactions ? 
    [...filteredTransactions].sort((a, b) => {
      const aAmount = type === 'expense' ? a.debit : a.credit;
      const bAmount = type === 'expense' ? b.debit : b.credit;
      return bAmount - aAmount;
    }) : [];
  
  return (
    <AnimatePresence>
      {isOpen && category && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className={`text-2xl ${type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                    {type === 'expense' ? '💸' : '💰'}
                  </span>
                  {category.name}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  {filteredTransactions?.length} transactions • Total: {formatCurrency(categoryTotal)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Category stats */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-xs text-white/60 mb-1">Transactions</p>
                  <p className="text-xl font-semibold text-white">{filteredTransactions?.length || 0}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-xs text-white/60 mb-1">Total Amount</p>
                  <p className={`text-xl font-semibold ${type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(categoryTotal || 0)}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg">
                  <p className="text-xs text-white/60 mb-1">
                    {type === 'expense' ? '% of Expenses' : '% of Income'}
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {type === 'expense' 
                      ? ((categoryTotal / (category.totalExpenses || 1)) * 100).toFixed(1)
                      : ((categoryTotal / (category.totalIncome || 1)) * 100).toFixed(1)
                    }%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
                              {filteredTransactions?.length > 0 ? (
                <>
                  <div className="p-4 bg-black/30 border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="text-sm text-white/70">Sorted by highest amount first</span>
                    </div>
                    <button
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors rounded-md text-xs text-white/70 hover:text-white"
                      onClick={() => {/* You could add sort options here in the future */}}
                    >
                      Highest First
                    </button>
                  </div>
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-white/5 sticky top-[57px]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {type === 'expense' ? 'Amount (Debit)' : 'Amount (Credit)'}
                        </th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-700 bg-black/20">
                    {sortedTransactions.map((transaction, index) => (
                      <tr key={index} className={`hover:bg-white/5 transition-colors ${index === 0 ? 'bg-white/10' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{transaction.description}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          type === 'expense' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {type === 'expense' 
                            ? formatCurrency(transaction.debit) 
                            : formatCurrency(transaction.credit)
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-white/60">No transactions found for this category</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/30 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                Close
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;