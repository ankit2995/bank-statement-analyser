import React, { useState, useCallback, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import _ from 'lodash';
import PrivacyNotice from './PrivacyNotice'; // Import the new component
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const BankStatementAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setError('');
      setAnalysisResults(null);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Extract category from description
  const extractCategory = useCallback((description) => {
    if (!description) return 'Uncategorized';
    
    const descLower = String(description).toLowerCase();
    
    // Specific investment categories based on user feedback
    if (descLower.includes('gullak') || descLower.includes('gullakmoney')) return 'Investments - Digital Gold';
    if (descLower.includes('zerodha')) return 'Investments - Direct Stocks';
    if (descLower.includes('bse limited') || (descLower.includes('bse') && descLower.includes('tsez'))) return 'Investments - Mutual Funds';
    if (descLower.includes('northeast') && descLower.includes('small') && descLower.includes('fin')) return 'Investments - Fixed Deposit';
    
    // Common categories to look for
    if (descLower.includes('salary') || descLower.includes('income')) return 'Salary';
    if (descLower.includes('rent')) return 'Rent';
    if (descLower.includes('interest') || descLower.includes('dividend') || 
        descLower.includes('invest') || descLower.includes('mutua') || 
        descLower.includes('stock') || descLower.includes('fixed deposit') || 
        descLower.includes('fd ')) return 'Investments';
    if (descLower.includes('food') || descLower.includes('swiggy') || 
        descLower.includes('zomato') || descLower.includes('restaurant') || 
        descLower.includes('café') || descLower.includes('cafe') || 
        descLower.includes('hotel')) return 'Food';
    if (descLower.includes('amazon') || descLower.includes('flipkart') || 
        descLower.includes('myntra') || descLower.includes('shopping') || 
        descLower.includes('retail') || descLower.includes('store')) return 'Shopping';
    if (descLower.includes('movie') || descLower.includes('entertainment') || 
        descLower.includes('netflix') || descLower.includes('prime') || 
        descLower.includes('hotstar') || descLower.includes('disney')) return 'Entertainment';
    if (descLower.includes('uber') || descLower.includes('ola') || 
        descLower.includes('transport') || descLower.includes('petrol') || 
        descLower.includes('fuel') || descLower.includes('metro') || 
        descLower.includes('bus') || descLower.includes('train')) return 'Transportation';
    if (descLower.includes('medical') || descLower.includes('hospital') || 
        descLower.includes('pharmacy') || descLower.includes('doctor') || 
        descLower.includes('health')) return 'Healthcare';
    if (descLower.includes('education') || descLower.includes('school') || 
        descLower.includes('college') || descLower.includes('tuition') || 
        descLower.includes('course')) return 'Education';
    if (descLower.includes('utility') || descLower.includes('bill') || 
        descLower.includes('electricity') || descLower.includes('water') || 
        descLower.includes('gas') || descLower.includes('internet') || 
        descLower.includes('phone') || descLower.includes('mobile')) return 'Utilities';
    if (descLower.includes('travel') || descLower.includes('flight') || 
        descLower.includes('hotel') || descLower.includes('holiday') || 
        descLower.includes('trip') || descLower.includes('tour')) return 'Travel';
        
    // Check for transaction methods only after checking specific categories
    if (descLower.includes('upi') || descLower.includes('imps') || 
        descLower.includes('neft') || descLower.includes('transfer')) return 'Transfer';
    
    // Check for ATM withdrawals
    if (descLower.includes('nwd') && descLower.includes('bengaluru')) return 'Cash Withdrawal - ATM';
    if (descLower.includes('nwd') || descLower.includes('atm') || descLower.includes('cash withdrawal')) return 'Cash Withdrawal - ATM';
    
    return 'Other';
  }, []);

  // Parse PDF file
  const parsePDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use minimal options to avoid worker issues
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        nativeImageDecoderSupport: 'display',
        isEvalSupported: false
      });
      
      let pdf;
      try {
        // First try without password
        pdf = await loadingTask.promise;
      } catch (e) {
        // Check if it's a password error
        if (e.name === 'PasswordException') {
          // PDF is password protected
          const password = prompt('This PDF is password protected. Please enter the password:');
          if (!password) {
            throw new Error('Password is required to open this PDF');
          }
          
          // Try again with password
          const passwordLoadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            password: password,
            nativeImageDecoderSupport: 'display',
            isEvalSupported: false
          });
          
          try {
            pdf = await passwordLoadingTask.promise;
          } catch (passwordError) {
            throw new Error('Invalid password or PDF format not supported.');
          }
        } else {
          // Some other error occurred
          console.error("PDF loading error:", e);
          throw new Error(`Error loading PDF: ${e.message}`);
        }
      }
      
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      
      // Split text into lines
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      console.log("Extracted PDF lines:", lines.slice(0, 20)); // Debug: show first 20 lines
      
      // ENHANCED APPROACH: Apply multiple strategies to detect transactions
      
      // Strategy 1: Look for standard transaction patterns with date, description, amounts
      const transactions = extractTransactionsUsingPatterns(lines);
      
      if (transactions.length > 0) {
        console.log(`Found ${transactions.length} transactions using pattern detection`);
        return transactions;
      }
      
      // Strategy 2: Try table-based extraction (header row + data rows)
      const tableTransactions = extractTransactionsFromTables(lines);
      
      if (tableTransactions.length > 0) {
        console.log(`Found ${tableTransactions.length} transactions using table extraction`);
        return tableTransactions;
      }
      
      // Strategy 3: Line-by-line extraction for less structured formats
      const lineByLineTransactions = extractTransactionsLineByLine(lines);
      
      if (lineByLineTransactions.length > 0) {
        console.log(`Found ${lineByLineTransactions.length} transactions using line-by-line extraction`);
        return lineByLineTransactions;
      }
      
      throw new Error("Could not identify transaction data in this PDF format");
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Error parsing PDF: ${error.message}`);
    }
  };
  
  // Helper function to extract transactions using pattern detection
  const extractTransactionsUsingPatterns = (lines) => {
    const transactions = [];
    
    // Common date patterns
    const datePattern = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/;
    
    // Common amount patterns (handles different formats: 1,234.56 or 1.234,56 or 1234.56)
    const amountPattern = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/g;
    
    // Process each line looking for transaction patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip lines that are too short to be transactions
      if (line.length < 10) continue;
      
      // Try to find a date
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;
      
      const date = dateMatch[0];
      
      // Get the rest of the line after the date for description and amounts
      const restOfLine = line.substring(line.indexOf(date) + date.length);
      
      // Find all potential amounts in the line
      const amounts = [];
      let match;
      while ((match = amountPattern.exec(restOfLine)) !== null) {
        // Clean up the amount and convert to number
        const cleanedAmount = match[0].replace(/,/g, '.');
        const amount = parseFloat(cleanedAmount);
        if (!isNaN(amount)) {
          amounts.push(amount);
        }
      }
      
      // Reset the regex pattern
      amountPattern.lastIndex = 0;
      
      // If we found at least one amount, create a transaction
      if (amounts.length > 0) {
        // Try to determine which is debit and which is credit
        // For simplicity, we'll assume the largest is the debit and the smallest is the credit
        // This is a heuristic and might need adjustment based on specific statement formats
        let debit = 0;
        let credit = 0;
        
        // If we only have one amount, decide based on context clues
        if (amounts.length === 1) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('withdrawal') || lowerLine.includes('debit') || 
              lowerLine.includes('payment') || lowerLine.includes('dr') || 
              lowerLine.includes('charge')) {
            debit = amounts[0];
          } else if (lowerLine.includes('deposit') || lowerLine.includes('credit') || 
                   lowerLine.includes('interest') || lowerLine.includes('cr') || 
                   lowerLine.includes('refund')) {
            credit = amounts[0];
          } else {
            // Default: positive amounts are credits, negative are debits
            if (amounts[0] < 0) {
              debit = Math.abs(amounts[0]);
            } else {
              credit = amounts[0];
            }
          }
        } else if (amounts.length >= 2) {
          // If multiple amounts, try to determine which is which
          // Sort amounts
          amounts.sort((a, b) => a - b);
          
          // Check for explicit markers near the amounts in the line
          const lineSegments = restOfLine.split(/\s+/);
          
          let debitAssigned = false;
          let creditAssigned = false;
          
          for (let j = 0; j < lineSegments.length; j++) {
            const segment = lineSegments[j].toLowerCase();
            const nextSegment = j < lineSegments.length - 1 ? lineSegments[j + 1] : '';
            
            // Check for explicit debit/credit markers
            if ((segment.includes('dr') || segment.includes('debit') || 
                segment.includes('withdrawal')) && !debitAssigned) {
              // Try to find an amount in this or the next segment
              const segmentAmount = parseFloat(nextSegment.replace(/[^\d.-]/g, ''));
              if (!isNaN(segmentAmount)) {
                debit = segmentAmount;
                debitAssigned = true;
              } else {
                // If no specific amount found, use the last amount
                debit = amounts[amounts.length - 1];
                debitAssigned = true;
              }
            } else if ((segment.includes('cr') || segment.includes('credit') || 
                     segment.includes('deposit')) && !creditAssigned) {
              // Try to find an amount in this or the next segment
              const segmentAmount = parseFloat(nextSegment.replace(/[^\d.-]/g, ''));
              if (!isNaN(segmentAmount)) {
                credit = segmentAmount;
                creditAssigned = true;
              } else {
                // If no specific amount found, use the first amount
                credit = amounts[0];
                creditAssigned = true;
              }
            }
          }
          
          // If we couldn't assign based on markers, use position-based heuristic
          if (!debitAssigned && !creditAssigned) {
            // Default assignment based on position in the line
            // This is a heuristic and might need adjustment
            if (amounts.length === 2) {
              // Two amounts: larger one is usually the balance, the other is the transaction
              if (Math.abs(amounts[0]) > Math.abs(amounts[1])) {
                // First amount is larger, treat second as transaction
                if (amounts[1] < 0) {
                  debit = Math.abs(amounts[1]);
                } else {
                  credit = amounts[1];
                }
              } else {
                // Second amount is larger, treat first as transaction
                if (amounts[0] < 0) {
                  debit = Math.abs(amounts[0]);
                } else {
                  credit = amounts[0];
                }
              }
            } else {
              // Three or more amounts, more complex logic needed
              // This is a simplified approach, might need refinement
              let debitCandidate = 0;
              let creditCandidate = 0;
              
              for (const amount of amounts) {
                if (amount < 0 && Math.abs(amount) > debitCandidate) {
                  debitCandidate = Math.abs(amount);
                } else if (amount > 0 && amount > creditCandidate) {
                  creditCandidate = amount;
                }
              }
              
              debit = debitCandidate;
              credit = creditCandidate;
            }
          }
        }
        
        // Clean up description, removing the date and amounts
        let description = restOfLine;
        // Remove all matched amounts from description
        for (const amount of amounts) {
          description = description.replace(amount.toString(), '');
        }
        // Clean up remaining punctuation and whitespace
        description = description.replace(/\s+/g, ' ').trim();
        
        // Create transaction object if we have valid data
        if ((debit > 0 || credit > 0) && description) {
          transactions.push({
            date,
            description,
            debit,
            credit,
            category: '' // Will be set later
          });
        }
      }
    }
    
    return transactions;
  };
  
  // Helper function to extract transactions from tabular data
  const extractTransactionsFromTables = (lines) => {
    const transactions = [];
    
    // Try to identify a header row that contains column names
    let headerRow = -1;
    let dateIndex = -1;
    let descIndex = -1;
    let debitIndex = -1;
    let creditIndex = -1;
    
    // Common header terms for each column
    const dateTerms = ['date', 'txn date', 'transaction date', 'value date'];
    const descTerms = ['description', 'particulars', 'narration', 'details', 'transaction'];
    const debitTerms = ['debit', 'withdrawal', 'payment', 'dr', 'paid out', 'amount (dr)'];
    const creditTerms = ['credit', 'deposit', 'receipt', 'cr', 'paid in', 'amount (cr)'];
    
    // Find header row
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].toLowerCase();
      
      // Check if this line contains header terms
      const hasDate = dateTerms.some(term => line.includes(term));
      const hasDesc = descTerms.some(term => line.includes(term));
      const hasDebit = debitTerms.some(term => line.includes(term));
      const hasCredit = creditTerms.some(term => line.includes(term));
      
      if ((hasDate && hasDesc) && (hasDebit || hasCredit)) {
        headerRow = i;
        
        // Find positions of each column
        for (const term of dateTerms) {
          const pos = line.indexOf(term);
          if (pos >= 0) {
            dateIndex = pos;
            break;
          }
        }
        
        for (const term of descTerms) {
          const pos = line.indexOf(term);
          if (pos >= 0) {
            descIndex = pos;
            break;
          }
        }
        
        for (const term of debitTerms) {
          const pos = line.indexOf(term);
          if (pos >= 0) {
            debitIndex = pos;
            break;
          }
        }
        
        for (const term of creditTerms) {
          const pos = line.indexOf(term);
          if (pos >= 0) {
            creditIndex = pos;
            break;
          }
        }
        
        break;
      }
    }
    
    // If we found a header row and column positions, extract transactions
    if (headerRow >= 0 && dateIndex >= 0 && descIndex >= 0 && (debitIndex >= 0 || creditIndex >= 0)) {
      // Determine column widths and positions
      const columnOrder = [
        { name: 'date', pos: dateIndex },
        { name: 'desc', pos: descIndex },
        { name: 'debit', pos: debitIndex >= 0 ? debitIndex : Number.MAX_SAFE_INTEGER },
        { name: 'credit', pos: creditIndex >= 0 ? creditIndex : Number.MAX_SAFE_INTEGER }
      ].filter(col => col.pos >= 0).sort((a, b) => a.pos - b.pos);
      
      // Process data rows
      for (let i = headerRow + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Skip lines that are too short
        if (line.length < 10) continue;
        
        // Check for date pattern to validate this is a transaction line
        const datePattern = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/;
        const dateMatch = line.match(datePattern);
        if (!dateMatch) continue;
        
        // Extract fields based on column positions
        let date = '';
        let description = '';
        let debit = 0;
        let credit = 0;
        
        for (let j = 0; j < columnOrder.length; j++) {
          const col = columnOrder[j];
          const nextColPos = j < columnOrder.length - 1 ? columnOrder[j + 1].pos : line.length;
          const fieldText = line.substring(col.pos, nextColPos).trim();
          
          if (col.name === 'date') {
            const dateMatch = fieldText.match(datePattern);
            if (dateMatch) date = dateMatch[0];
          } else if (col.name === 'desc') {
            description = fieldText;
          } else if (col.name === 'debit') {
            // Extract amount pattern
            const amountMatch = fieldText.match(/\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/);
            if (amountMatch) {
              const cleanedAmount = amountMatch[0].replace(/,/g, '.');
              debit = parseFloat(cleanedAmount);
            }
          } else if (col.name === 'credit') {
            // Extract amount pattern
            const amountMatch = fieldText.match(/\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/);
            if (amountMatch) {
              const cleanedAmount = amountMatch[0].replace(/,/g, '.');
              credit = parseFloat(cleanedAmount);
            }
          }
        }
        
        // Create transaction if we have valid data
        if (date && (debit > 0 || credit > 0)) {
          transactions.push({
            date,
            description,
            debit: isNaN(debit) ? 0 : debit,
            credit: isNaN(credit) ? 0 : credit,
            category: '' // Will be set later
          });
        }
      }
    }
    
    return transactions;
  };
  
  // Helper function for line-by-line transaction extraction (last resort)
  const extractTransactionsLineByLine = (lines) => {
    const transactions = [];
    
    // Date patterns
    const datePattern = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/;
    
    // Amount patterns
    const amountPattern = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/;
    
    // Process each line individually
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 10) continue;
      
      // Check for date
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;
      
      const date = dateMatch[0];
      
      // Look for amounts
      const amounts = [];
      let currentLine = line;
      let amountMatch;
      
      // Find all amounts in the line
      while ((amountMatch = currentLine.match(amountPattern)) !== null) {
        const cleanedAmount = amountMatch[0].replace(/,/g, '.');
        const amount = parseFloat(cleanedAmount);
        if (!isNaN(amount)) {
          amounts.push(amount);
        }
        // Remove the matched amount to find the next one
        currentLine = currentLine.replace(amountMatch[0], '');
      }
      
      if (amounts.length === 0) continue;
      
      // Determine description - everything except date and amounts
      let description = line;
      description = description.replace(dateMatch[0], '');
      for (const amount of amounts) {
        description = description.replace(amount.toString(), '');
      }
      description = description.replace(/\s+/g, ' ').trim();
      
      // Determine debit/credit
      let debit = 0;
      let credit = 0;
      
      // Check for context clues
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('withdrawal') || lowerLine.includes('debit') || 
          lowerLine.includes('dr') || lowerLine.includes('charge')) {
        // Likely a debit transaction
        debit = Math.max(...amounts);
      } else if (lowerLine.includes('deposit') || lowerLine.includes('credit') || 
               lowerLine.includes('cr') || lowerLine.includes('interest')) {
        // Likely a credit transaction
        credit = Math.max(...amounts);
      } else if (amounts.length >= 2) {
        // If we have multiple amounts, check if any are negative
        const negativeAmounts = amounts.filter(a => a < 0);
        const positiveAmounts = amounts.filter(a => a > 0);
        
        if (negativeAmounts.length > 0) {
          debit = Math.abs(Math.min(...negativeAmounts));
        }
        if (positiveAmounts.length > 0) {
          credit = Math.max(...positiveAmounts);
        }
        
        // If still no clear debit/credit, use the first amount as debit (more common)
        if (debit === 0 && credit === 0 && amounts.length > 0) {
          debit = amounts[0];
        }
      } else if (amounts.length === 1) {
        // Single amount, assume debit by default
        debit = amounts[0];
      }
      
      // Create transaction if we have valid data
      if (date && description && (debit > 0 || credit > 0)) {
        transactions.push({
          date,
          description,
          debit: isNaN(debit) ? 0 : debit,
          credit: isNaN(credit) ? 0 : credit,
          category: '' // Will be set later
        });
      }
    }
    
    return transactions;
  };

  // Process Excel Data
  const processExcelData = (rawData) => {
    // Find header row
    let headerRow = -1;
    for (let i = 0; i < Math.min(rawData.length, 100); i++) {
      const row = rawData[i].map(cell => String(cell).toLowerCase());
      const hasDate = row.some(cell => cell.includes('date'));
      const hasDebit = row.some(cell => cell.includes('withdrawal') || cell.includes('debit') || cell.includes('dr'));
      const hasCredit = row.some(cell => cell.includes('deposit') || cell.includes('credit') || cell.includes('cr'));
      
      if (hasDate && (hasDebit || hasCredit)) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow < 0) {
      throw new Error("Could not identify transaction headers in the statement");
    }
    
    const headers = rawData[headerRow];
    
    // Find column indices
    const dateIdx = headers.findIndex(h => String(h).toLowerCase().includes('date'));
    const descIdx = headers.findIndex(h => 
      String(h).toLowerCase().includes('description') || 
      String(h).toLowerCase().includes('particulars') || 
      String(h).toLowerCase().includes('narration')
    );
    const debitIdx = headers.findIndex(h => 
      String(h).toLowerCase().includes('withdrawal') || 
      String(h).toLowerCase().includes('debit') || 
      String(h).toLowerCase().includes('dr')
    );
    const creditIdx = headers.findIndex(h => 
      String(h).toLowerCase().includes('deposit') || 
      String(h).toLowerCase().includes('credit') || 
      String(h).toLowerCase().includes('cr')
    );
    const balanceIdx = headers.findIndex(h => String(h).toLowerCase().includes('balance'));
    
    if (dateIdx < 0 || descIdx < 0 || (debitIdx < 0 && creditIdx < 0)) {
      throw new Error("Could not identify required columns (date, description, debit/credit)");
    }
    
    // Extract transactions
    const transactions = [];
    for (let i = headerRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip rows that don't have enough data
      if (!row[dateIdx] || row.length < Math.max(dateIdx, descIdx, debitIdx, creditIdx)) {
        continue;
      }
      
      // Try to validate date
      let dateStr = String(row[dateIdx]);
      let isValidDate = /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(dateStr) || 
                      row[dateIdx] instanceof Date;
      
      if (!isValidDate) continue;
      
      const transaction = {
        date: row[dateIdx],
        description: row[descIdx] || '',
        debit: 0,
        credit: 0,
        balance: balanceIdx >= 0 ? row[balanceIdx] : '',
        category: ''
      };
      
      // Parse debit and credit amounts
      if (debitIdx >= 0 && row[debitIdx]) {
        try {
          // Clean up the amount string and convert to number
          const debitStr = String(row[debitIdx]).replace(/[^\d.-]/g, '');
          transaction.debit = debitStr ? parseFloat(debitStr) : 0;
        } catch (e) {
          transaction.debit = 0;
        }
      }
      
      if (creditIdx >= 0 && row[creditIdx]) {
        try {
          // Clean up the amount string and convert to number
          const creditStr = String(row[creditIdx]).replace(/[^\d.-]/g, '');
          transaction.credit = creditStr ? parseFloat(creditStr) : 0;
        } catch (e) {
          transaction.credit = 0;
        }
      }
      
      // Only add if it has at least one valid amount
      if (transaction.debit > 0 || transaction.credit > 0) {
        transactions.push(transaction);
      }
    }
    
    if (transactions.length === 0) {
      throw new Error("No valid transactions found in the statement");
    }
    
    return transactions; // Return the transactions instead of calling processTransactions directly
  };

  // Analyze bank statement
  const analyzeStatement = async () => {
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const fileExt = fileName.split('.').pop().toLowerCase();
      let transactions;
      
      if (fileExt === 'pdf') {
        transactions = await parsePDF(file);
        processTransactions(transactions);
      } else {
        const fileReader = new FileReader();
        
        fileReader.onload = function(event) {
          try {
            let parsedTransactions;
            
            if (fileExt === 'csv') {
              // Handle CSV files
              const csvText = event.target.result;
              const parsedData = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true
              });
              
              if (parsedData.errors.length > 0) {
                throw new Error(`CSV parsing error: ${parsedData.errors[0].message}`);
              }
              
              parsedTransactions = parsedData.data.map(row => ({
                date: row.Date || row.date || row.txn_date || '',
                description: row.Description || row.description || row.particulars || row.narration || '',
                debit: parseFloat(row.Debit || row.debit || row.withdrawal || row.dr || 0) || 0,
                credit: parseFloat(row.Credit || row.credit || row.deposit || row.cr || 0) || 0,
                balance: row.Balance || row.balance || '',
                category: '' // Will be set later
              })).filter(t => t.date && (t.debit > 0 || t.credit > 0));
            } else {
              // Handle Excel files
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
              });
              
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
              parsedTransactions = processExcelData(rawData);
            }
            
            if (parsedTransactions && parsedTransactions.length > 0) {
              processTransactions(parsedTransactions);
            } else {
              throw new Error("No valid transactions found");
            }
          } catch (err) {
            console.error(err);
            setError(`Error analyzing statement: ${err.message}`);
            setLoading(false);
          }
        };
        
        fileReader.onerror = function() {
          setError('Error reading file');
          setLoading(false);
        };
        
        if (fileExt === 'csv') {
          fileReader.readAsText(file);
        } else {
          fileReader.readAsArrayBuffer(file);
        }
      }
    } catch (err) {
      console.error(err);
      setError(`Error analyzing statement: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Process transactions for analysis
  const processTransactions = (transactions) => {
    // Categorize transactions
    transactions.forEach(t => {
      t.category = extractCategory(t.description);
    });
    
    // 1. Total income and expenses
    const totalIncome = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalExpenses = transactions.reduce((sum, t) => sum + t.debit, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    // 2. Monthly breakdown
    const monthlyData = {};
    
    transactions.forEach(t => {
      let date;
      if (t.date instanceof Date) {
        date = t.date;
      } else {
        // Try to parse the date string (handle various formats)
        try {
          // First try direct parsing
          date = new Date(t.date);
          
          // If that fails, try DD/MM/YYYY format
          if (isNaN(date.getTime())) {
            const dateParts = String(t.date).split(/[\/-]/);
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1; // JS months are 0-based
              let year = parseInt(dateParts[2]);
              if (year < 100) year += 2000; // Fix 2-digit years
              date = new Date(year, month, day);
            }
          }
        } catch (e) {
          // If parsing fails, skip this transaction for monthly analysis
          return;
        }
      }
      
      if (date && !isNaN(date.getTime())) {
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleString('default', { month: 'short' }) + " '" + (date.getFullYear().toString().slice(-2));
        
        if (!monthlyData[yearMonth]) {
          monthlyData[yearMonth] = {
            month: monthName,
            income: 0,
            expenses: 0,
            transactions: 0
          };
        }
        
        monthlyData[yearMonth].income += t.credit;
        monthlyData[yearMonth].expenses += t.debit;
        monthlyData[yearMonth].transactions++;
      }
    });
    
    // Sort months and calculate additional metrics
    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyAnalysis = sortedMonths.map(month => ({
      month: monthlyData[month].month,
      rawMonth: month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
      savings: monthlyData[month].income - monthlyData[month].expenses,
      savingsRate: (monthlyData[month].income > 0) ? 
        ((monthlyData[month].income - monthlyData[month].expenses) / monthlyData[month].income) * 100 : 0,
      transactions: monthlyData[month].transactions
    }));
    
    // 3. Category analysis
    const categorySpending = {};
    const categoryIncome = {};
    
    transactions.forEach(t => {
      const category = t.category;
      
      // Initialize categories if needed
      if (!categorySpending[category]) categorySpending[category] = 0;
      if (!categoryIncome[category]) categoryIncome[category] = 0;
      
      // Add to category totals
      if (t.debit > 0) categorySpending[category] += t.debit;
      if (t.credit > 0) categoryIncome[category] += t.credit;
    });
    
    // Convert to arrays for charts
    const categorySpendingArray = Object.entries(categorySpending)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    const categoryIncomeArray = Object.entries(categoryIncome)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    // 4. Day of week analysis
    const dayOfWeekSpending = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    transactions.forEach(t => {
      if (t.debit > 0) {
        let date;
        try {
          // Try direct Date parsing
          date = new Date(t.date);
          
          // If invalid, try DD/MM/YYYY format
          if (isNaN(date.getTime())) {
            const dateParts = String(t.date).split(/[\/-]/);
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1;
              let year = parseInt(dateParts[2]);
              if (year < 100) year += 2000;
              date = new Date(year, month, day);
            }
          }
        } catch (e) {
          return;
        }
        
        if (date && !isNaN(date.getTime())) {
          const dayOfWeek = dayNames[date.getDay()];
          dayOfWeekSpending[dayOfWeek] += t.debit;
        }
      }
    });
    
    // Convert to array for chart
    const dayOfWeekArray = Object.entries(dayOfWeekSpending)
      .map(([name, value]) => ({ name, value }));
    
    // 5. Recurring transactions
    const recurringPatterns = {};
    
    transactions.forEach(t => {
      // Simplify description to find patterns
      const simpleDesc = String(t.description)
        .replace(/\d+/g, '')
        .replace(/[\/\-\.]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      if (simpleDesc.length > 3) {
        if (!recurringPatterns[simpleDesc]) {
          recurringPatterns[simpleDesc] = {
            count: 0,
            totalDebit: 0,
            totalCredit: 0,
            originalDescription: t.description
          };
        }
        
        recurringPatterns[simpleDesc].count++;
        recurringPatterns[simpleDesc].totalDebit += t.debit;
        recurringPatterns[simpleDesc].totalCredit += t.credit;
      }
    });
    
    // Filter for patterns that occur multiple times
    const potentialRecurring = Object.entries(recurringPatterns)
      .filter(([desc, data]) => data.count > 1)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([desc, data]) => ({
        description: data.originalDescription,
        occurrences: data.count,
        avgDebit: data.totalDebit > 0 ? data.totalDebit / data.count : 0,
        avgCredit: data.totalCredit > 0 ? data.totalCredit / data.count : 0,
        type: data.totalDebit > data.totalCredit ? 'expense' : 'income'
      }));
    
    // 6. Top transactions
    const topExpenses = transactions
      .filter(t => t.debit > 0)
      .sort((a, b) => b.debit - a.debit)
      .slice(0, 5);
      
    const topIncome = transactions
      .filter(t => t.credit > 0)
      .sort((a, b) => b.credit - a.credit)
      .slice(0, 5);
    
    // 7. Calculate insights
    const insights = [];
    
    // Savings rate insight
    if (savingsRate < 10) {
      insights.push({
        type: 'warning',
        text: `Your savings rate is only ${savingsRate.toFixed(1)}%. Consider aiming for at least 20% for long-term financial health.`
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: 'positive',
        text: `Great job! Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%.`
      });
    }
    
    // Monthly variation insights
    const monthsWithNegativeSavings = monthlyAnalysis.filter(m => m.savings < 0);
    if (monthsWithNegativeSavings.length > 0) {
      insights.push({
        type: 'warning',
        text: `You had negative savings in ${monthsWithNegativeSavings.length} months. Consider building an emergency fund to cover high-expense months.`
      });
    }
    
    // Best and worst months
    const bestMonth = _.maxBy(monthlyAnalysis, 'savingsRate');
    const worstMonth = _.minBy(monthlyAnalysis, 'savingsRate');
    
    if (bestMonth) {
      insights.push({
        type: 'positive',
        text: `Your best month was ${bestMonth.month} with a savings rate of ${bestMonth.savingsRate.toFixed(1)}%.`
      });
    }
    
    if (worstMonth && worstMonth.savingsRate < 0) {
      insights.push({
        type: 'warning',
        text: `Your most challenging month was ${worstMonth.month} with a savings rate of ${worstMonth.savingsRate.toFixed(1)}%.`
      });
    }
    
    // Weekend spending insight
    const weekdaySpending = dayOfWeekSpending.Monday + dayOfWeekSpending.Tuesday + 
                          dayOfWeekSpending.Wednesday + dayOfWeekSpending.Thursday + 
                          dayOfWeekSpending.Friday;
    const weekendSpending = dayOfWeekSpending.Saturday + dayOfWeekSpending.Sunday;
    const avgWeekdaySpending = weekdaySpending / 5;
    const avgWeekendSpending = weekendSpending / 2;
    
    if (avgWeekendSpending > avgWeekdaySpending * 1.5) {
      insights.push({
        type: 'info',
        text: `Your weekend spending is ${(avgWeekendSpending / avgWeekdaySpending).toFixed(1)}x higher than weekdays. Consider setting a weekend budget.`
      });
    }
    
    // Investment insight
    const investmentPercentage = (categorySpending.Investments || 0) / totalExpenses * 100;
    if (investmentPercentage < 10) {
      insights.push({
        type: 'suggestion',
        text: `Only ${investmentPercentage.toFixed(1)}% of your expenses are investments. Consider increasing this to 15-20% for long-term growth.`
      });
    }
    
    // Set analysis results
    setAnalysisResults({
      transactions,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      monthlyAnalysis,
      categorySpendingArray,
      categoryIncomeArray,
      dayOfWeekArray,
      potentialRecurring,
      topExpenses,
      topIncome,
      insights
    });
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')] bg-cover bg-center opacity-10 animate-pulse-slow"></div>
      
      {/* Content Container */}
      <motion.div 
        className="relative max-w-6xl mx-auto p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1 
          className="text-4xl font-bold mb-6 text-center text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient"
          variants={itemVariants}
        >
          Pixel Wealth
        </motion.h1>
        <PrivacyNotice />

        {/* File Upload Section */}
        <motion.div 
          className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Upload Your Bank Statement</h2>
          <p className="text-white/70 text-sm mb-4 bg-yellow-500/20 p-2 rounded-md border border-yellow-500/30">
            <strong>Note:</strong> Currently optimized for HDFC Bank statements in XLS format only. Other formats may not parse correctly.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-grow">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-white/70 animate-bounce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-white/70">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-white/50">XLS, XLSX, CSV, or PDF</p>
                  {fileName && <p className="mt-2 text-sm font-medium text-blue-400 animate-fade-in">{fileName}</p>}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xls,.xlsx,.csv,.pdf" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <motion.button 
              onClick={analyzeStatement}
              disabled={loading || !file}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 ${
                !file 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : 'Analyze Statement'}
            </motion.button>
          </div>
          {error && <motion.p className="mt-4 text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
        </motion.div>
        
        {/* Analysis Results Section */}
        {analysisResults && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Tabs */}
            <div className="border-b border-white/20 mb-6">
              <nav className="flex -mb-px">
                {['summary', 'monthly', 'categories', 'patterns', 'insights'].map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-300 ${
                      activeTab === tab
                        ? 'border-blue-400 text-blue-400'
                        : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </nav>
            </div>
            
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                className="mt-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 className="text-2xl font-bold mb-6 text-white" variants={itemVariants}>Financial Summary</motion.h2>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      {[
                        { title: 'Total Income', value: analysisResults.totalIncome, color: 'blue' },
                        { title: 'Total Expenses', value: analysisResults.totalExpenses, color: 'red' },
                        { 
                          title: 'Net Savings', 
                          value: analysisResults.netSavings, 
                          color: analysisResults.netSavings >= 0 ? 'green' : 'red' 
                        },
                        { 
                          title: 'Savings Rate', 
                          value: `${analysisResults.savingsRate.toFixed(2)}%`, 
                          color: analysisResults.savingsRate >= 0 ? 'purple' : 'red' 
                        }
                      ].map((card, index) => (
                        <motion.div
                          key={index}
                          className={`bg-${card.color}-500/20 p-4 rounded-lg shadow-lg border border-${card.color}-400/30`}
                          variants={itemVariants}
                          whileHover="hover"
                        >
                          <h3 className={`text-lg font-semibold text-${card.color}-200`}>{card.title}</h3>
                          <p className="text-2xl font-bold text-white">{typeof card.value === 'number' ? formatCurrency(card.value) : card.value}</p>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Top Expenses */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Top Expenses</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 border-b text-left">Date</th>
                              <th className="py-2 px-4 border-b text-left">Description</th>
                              <th className="py-2 px-4 border-b text-right">Amount</th>
                              <th className="py-2 px-4 border-b text-left">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.topExpenses.map((expense, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-2 px-4 border-b">{expense.date}</td>
                                <td className="py-2 px-4 border-b">{expense.description}</td>
                                <td className="py-2 px-4 border-b text-right">{formatCurrency(expense.debit)}</td>
                                <td className="py-2 px-4 border-b">{expense.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Top Income Sources */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Top Income Sources</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 border-b text-left">Date</th>
                              <th className="py-2 px-4 border-b text-left">Description</th>
                              <th className="py-2 px-4 border-b text-right">Amount</th>
                              <th className="py-2 px-4 border-b text-left">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.topIncome.map((income, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-2 px-4 border-b">{income.date}</td>
                                <td className="py-2 px-4 border-b">{income.description}</td>
                                <td className="py-2 px-4 border-b text-right">{formatCurrency(income.credit)}</td>
                                <td className="py-2 px-4 border-b">{income.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Monthly Analysis Tab */}
                {activeTab === 'monthly' && (
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 className="text-2xl font-bold mb-6 text-white" variants={itemVariants}>Monthly Analysis</motion.h2>
                    
                    {/* Monthly Income vs Expenses Chart */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Monthly Income vs Expenses</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analysisResults.monthlyAnalysis}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" angle={-45} textAnchor="end" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#4CAF50" />
                            <Bar dataKey="expenses" name="Expenses" fill="#F44336" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Monthly Savings Chart */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Monthly Savings Trend</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={analysisResults.monthlyAnalysis}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" angle={-45} textAnchor="end" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="savings" 
                              name="Savings" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Monthly Data Table */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Monthly Details</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 border-b text-left">Month</th>
                              <th className="py-2 px-4 border-b text-right">Income</th>
                              <th className="py-2 px-4 border-b text-right">Expenses</th>
                              <th className="py-2 px-4 border-b text-right">Savings</th>
                              <th className="py-2 px-4 border-b text-right">Savings Rate</th>
                              <th className="py-2 px-4 border-b text-center">Transactions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.monthlyAnalysis.map((month, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-2 px-4 border-b">{month.month}</td>
                                <td className="py-2 px-4 border-b text-right">{formatCurrency(month.income)}</td>
                                <td className="py-2 px-4 border-b text-right">{formatCurrency(month.expenses)}</td>
                                <td className={`py-2 px-4 border-b text-right ${month.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(month.savings)}
                                </td>
                                <td className={`py-2 px-4 border-b text-right ${month.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {month.savingsRate.toFixed(2)}%
                                </td>
                                <td className="py-2 px-4 border-b text-center">{month.transactions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Categories Tab */}
                {activeTab === 'categories' && (
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 className="text-2xl font-bold mb-6 text-white" variants={itemVariants}>Categories Analysis</motion.h2>
                    
                    {/* Categories Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {/* Expense Categories */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Expense Categories</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analysisResults.categorySpendingArray.slice(0, 7)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {analysisResults.categorySpendingArray.slice(0, 7).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      {/* Income Categories */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Income Categories</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analysisResults.categoryIncomeArray.slice(0, 7)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {analysisResults.categoryIncomeArray.slice(0, 7).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    {/* Categories Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Expense Categories Table */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Expense Categories Detail</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-2 px-4 border-b text-left">Category</th>
                                <th className="py-2 px-4 border-b text-right">Amount</th>
                                <th className="py-2 px-4 border-b text-right">% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResults.categorySpendingArray.map((category, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                  <td className="py-2 px-4 border-b">{category.name}</td>
                                  <td className="py-2 px-4 border-b text-right">{formatCurrency(category.value)}</td>
                                  <td className="py-2 px-4 border-b text-right">
                                    {((category.value / analysisResults.totalExpenses) * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Income Categories Table */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Income Categories Detail</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-2 px-4 border-b text-left">Category</th>
                                <th className="py-2 px-4 border-b text-right">Amount</th>
                                <th className="py-2 px-4 border-b text-right">% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResults.categoryIncomeArray.map((category, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                  <td className="py-2 px-4 border-b">{category.name}</td>
                                  <td className="py-2 px-4 border-b text-right">{formatCurrency(category.value)}</td>
                                  <td className="py-2 px-4 border-b text-right">
                                    {((category.value / analysisResults.totalIncome) * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Spending Patterns Tab */}
                {activeTab === 'patterns' && (
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 className="text-2xl font-bold mb-6 text-white" variants={itemVariants}>Spending Patterns</motion.h2>
                    
                    {/* Day of Week Spending */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Spending by Day of Week</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analysisResults.dayOfWeekArray}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Bar dataKey="value" name="Amount" fill="#FF8042" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Recurring Transactions */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Recurring Transactions</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 border-b text-left">Description</th>
                              <th className="py-2 px-4 border-b text-center">Occurrences</th>
                              <th className="py-2 px-4 border-b text-right">Avg. Amount</th>
                              <th className="py-2 px-4 border-b text-center">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.potentialRecurring.map((transaction, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="py-2 px-4 border-b">{transaction.description}</td>
                                <td className="py-2 px-4 border-b text-center">{transaction.occurrences}</td>
                                <td className="py-2 px-4 border-b text-right">
                                  {formatCurrency(transaction.type === 'expense' ? transaction.avgDebit : transaction.avgCredit)}
                                </td>
                                <td className="py-2 px-4 border-b text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <motion.div 
                    className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h2 className="text-2xl font-bold mb-6 text-white" variants={itemVariants}>Financial Insights</motion.h2>
                    
                    <div className="space-y-6">
                      {analysisResults.insights.map((insight, index) => (
                        <motion.div 
                          key={index} 
                          className={`p-4 rounded-lg shadow ${
                            insight.type === 'positive' ? 'bg-green-50 border-l-4 border-green-500' :
                            insight.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                            insight.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-500' :
                            'bg-purple-50 border-l-4 border-purple-500'
                          }`}
                          variants={itemVariants}
                        >
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {insight.type === 'positive' && (
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {insight.type === 'warning' && (
                                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              {insight.type === 'info' && (
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {insight.type === 'suggestion' && (
                                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-gray-700">{insight.text}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Additional recommendations */}
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                          <h4 className="font-semibold text-lg mb-2">Based on your financial data, here are some recommendations:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Follow the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings or debt repayment.</li>
                            <li>Build an emergency fund to cover 3-6 months of expenses.</li>
                            <li>Review your recurring expenses and subscriptions to identify potential areas to cut back.</li>
                            <li>Consider automating savings to ensure you consistently set money aside.</li>
                            <li>Track your expenses regularly to stay aware of your spending patterns.</li>
                            <li>Plan for large expenses by creating specific savings goals.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default BankStatementAnalyzer;