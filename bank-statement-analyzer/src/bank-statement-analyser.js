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

// Add custom styles for logo animations
const logoAnimationStyles = `
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes ping-slow {
    0% { opacity: 0.2; transform: translateX(0); }
    50% { opacity: 0.8; }
    100% { opacity: 0.2; transform: translateX(10px); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-ping-slow {
    animation: ping-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

const BankStatementAnalyzer = () => {
  // Inject the animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = logoAnimationStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
  // Extract category from description with enhanced financial intelligence
const extractCategory = useCallback((description, amount) => {
  if (!description) return 'Uncategorized';
  
  const descLower = String(description).toLowerCase();
  const isCredit = amount > 0;
  
  // ========== INCOME CATEGORIES ==========
  if (isCredit) {
    // Salary and income
    if (descLower.includes('salary') || 
        descLower.includes('sal ') || 
        descLower.includes('income') || 
        descLower.includes('stipend') ||
        descLower.includes('commission') ||
        descLower.includes('bonus')) return 'Income - Salary';
    
    // Rental income
    if (descLower.includes('rent') && isCredit) return 'Income - Rental';
    
    // Interest income
    if ((descLower.includes('interest') || descLower.includes('int cr')) && isCredit) return 'Income - Interest';
    
    // Refunds
    if (descLower.includes('refund') || 
        descLower.includes('cashback') || 
        descLower.includes('reversal')) return 'Income - Refunds';
  }
  
  // ========== INVESTMENT CATEGORIES ==========
  // Specific investment categories based on user feedback
  if (descLower.includes('gullak') || descLower.includes('gullakmoney')) return 'Investments - Digital Gold';
  if (descLower.includes('zerodha') || 
      descLower.includes('groww') || 
      descLower.includes('upstox') ||
      descLower.includes('icici direct') ||
      descLower.includes('angel broking')) return 'Investments - Direct Stocks';
  if (descLower.includes('bse limited') || 
      (descLower.includes('bse') && descLower.includes('tsez')) ||
      descLower.includes('kfintech') ||
      descLower.includes('cams') ||
      descLower.includes('sip')) return 'Investments - Mutual Funds';
  if ((descLower.includes('northeast') && descLower.includes('small') && descLower.includes('fin')) ||
      descLower.includes('fd ') || 
      descLower.includes('fixed deposit') ||
      descLower.includes('deposit opening')) return 'Investments - Fixed Deposit';
  if (descLower.includes('ppf') || 
      descLower.includes('nps') || 
      descLower.includes('epf')) return 'Investments - Retirement';
  if (descLower.includes('gold') || 
      descLower.includes('silver') ||
      descLower.includes('bullion')) return 'Investments - Precious Metals';
  if (descLower.includes('crypto') || 
      descLower.includes('bitcoin') || 
      descLower.includes('ethereum') || 
      descLower.includes('wazirx') ||
      descLower.includes('coindcx')) return 'Investments - Cryptocurrency';
    
  // General investments
  if (descLower.includes('invest') || 
      descLower.includes('dividend') ||
      descLower.includes('mutua') ||
      descLower.includes('stock') ||
      descLower.includes('shares')) return 'Investments - General';
  
  // ========== INSURANCE CATEGORIES ==========
  if (descLower.includes('life insurance') || 
      descLower.includes('lic') || 
      descLower.includes('hdfc life')) return 'Insurance - Life';
  if (descLower.includes('health insurance') || 
      descLower.includes('star health') || 
      descLower.includes('apollo') ||
      descLower.includes('max bupa')) return 'Insurance - Health';
  if (descLower.includes('car insurance') || 
      descLower.includes('vehicle insurance') || 
      descLower.includes('two wheeler')) return 'Insurance - Vehicle';
  if (descLower.includes('insurance') || 
      descLower.includes('policy')) return 'Insurance - General';
  
  // ========== LOAN CATEGORIES ==========
  if (descLower.includes('home loan') || 
      descLower.includes('mortgage')) return 'Loans - Home Loan';
  if (descLower.includes('personal loan') || 
      descLower.includes('pl emi')) return 'Loans - Personal Loan';
  if (descLower.includes('car loan') || 
      descLower.includes('vehicle loan') || 
      descLower.includes('auto loan')) return 'Loans - Vehicle Loan';
  if (descLower.includes('education loan') || 
      descLower.includes('student loan')) return 'Loans - Education Loan';
  if (descLower.includes('loan') || 
      descLower.includes('emi') || 
      descLower.includes('equated')) return 'Loans - Other EMIs';
    
  // ========== DAILY EXPENSE CATEGORIES ==========
  if (descLower.includes('food') || 
      descLower.includes('swiggy') ||
      descLower.includes('zomato') || 
      descLower.includes('restaurant') ||
      descLower.includes('café') || 
      descLower.includes('cafe') ||
      descLower.includes('hotel') ||
      descLower.includes('bakery') ||
      descLower.includes('biryani') ||
      descLower.includes('pizza') ||
      descLower.includes('mcd') ||
      descLower.includes('dominos')) return 'Expenses - Food & Dining';
    
  if (descLower.includes('amazon') || 
      descLower.includes('flipkart') ||
      descLower.includes('myntra') || 
      descLower.includes('shopping') ||
      descLower.includes('retail') || 
      descLower.includes('store') ||
      descLower.includes('mall') ||
      descLower.includes('bigbasket') ||
      descLower.includes('grofers') ||
      descLower.includes('reliance') ||
      descLower.includes('dmart')) return 'Expenses - Shopping';
    
  if (descLower.includes('movie') || 
      descLower.includes('entertainment') ||
      descLower.includes('netflix') || 
      descLower.includes('prime') ||
      descLower.includes('hotstar') || 
      descLower.includes('disney') ||
      descLower.includes('bookmyshow') ||
      descLower.includes('pvr') ||
      descLower.includes('inox') ||
      descLower.includes('spotify') ||
      descLower.includes('gaana')) return 'Expenses - Entertainment';
    
  if (descLower.includes('uber') || 
      descLower.includes('ola') ||
      descLower.includes('transport') || 
      descLower.includes('petrol') ||
      descLower.includes('fuel') || 
      descLower.includes('metro') ||
      descLower.includes('bus') || 
      descLower.includes('train') ||
      descLower.includes('irctc') ||
      descLower.includes('rapido') ||
      descLower.includes('yulu')) return 'Expenses - Transportation';
    
  if (descLower.includes('medical') || 
      descLower.includes('hospital') ||
      descLower.includes('pharmacy') || 
      descLower.includes('doctor') ||
      descLower.includes('health') ||
      descLower.includes('apollo') ||
      descLower.includes('medplus') ||
      descLower.includes('netmeds') ||
      descLower.includes('pharmeasy') ||
      descLower.includes('clinic')) return 'Expenses - Healthcare';
    
  if (descLower.includes('education') || 
      descLower.includes('school') ||
      descLower.includes('college') || 
      descLower.includes('tuition') ||
      descLower.includes('course') ||
      descLower.includes('class') ||
      descLower.includes('coaching') ||
      descLower.includes('udemy') ||
      descLower.includes('coursera')) return 'Expenses - Education';
    
  if (descLower.includes('utility') || 
      descLower.includes('bill') ||
      descLower.includes('electricity') || 
      descLower.includes('water') ||
      descLower.includes('gas') || 
      descLower.includes('internet') ||
      descLower.includes('phone') || 
      descLower.includes('mobile') ||
      descLower.includes('broadband') ||
      descLower.includes('wifi') ||
      descLower.includes('bescom') ||
      descLower.includes('airtel') ||
      descLower.includes('jio') ||
      descLower.includes('vi ') ||
      descLower.includes('bsnl')) return 'Expenses - Utilities';
    
  if (descLower.includes('travel') || 
      descLower.includes('flight') ||
      descLower.includes('hotel') && !descLower.includes('food') || 
      descLower.includes('holiday') ||
      descLower.includes('trip') || 
      descLower.includes('tour') ||
      descLower.includes('makemytrip') ||
      descLower.includes('goibibo') ||
      descLower.includes('easemytrip') ||
      descLower.includes('oyo') ||
      descLower.includes('airbnb')) return 'Expenses - Travel';
      
  if (descLower.includes('gift') || 
      descLower.includes('donation') ||
      descLower.includes('charity')) return 'Expenses - Gifts & Donations';
      
  if (descLower.includes('maintenance') || 
      descLower.includes('repair') ||
      descLower.includes('renovation')) return 'Expenses - Home & Maintenance';
      
  // ========== TRANSFER CATEGORIES ==========
  // Check for transaction methods only after checking specific categories
  if (descLower.includes('upi') && (descLower.includes('payment') || descLower.includes('sent'))) return 'Transfer - UPI Payment';
  if (descLower.includes('upi') && (descLower.includes('received') || descLower.includes('credit'))) return 'Transfer - UPI Received';
  if (descLower.includes('imps') || 
      descLower.includes('neft') || 
      descLower.includes('rtgs') ||
      descLower.includes('transfer')) return 'Transfer - Bank Transfer';
      
  // ========== CASH WITHDRAWAL CATEGORIES ==========
  // Check for ATM withdrawals
  if (descLower.includes('nwd') ||
      descLower.includes('atm') || 
      descLower.includes('cash withdrawal') ||
      descLower.includes('cwl')) {
    // Categorize by location if available
    if (descLower.includes('bengaluru') || descLower.includes('bangalore')) return 'Cash Withdrawal - Bangalore';
    if (descLower.includes('mumbai') || descLower.includes('bombay')) return 'Cash Withdrawal - Mumbai';
    if (descLower.includes('delhi') || descLower.includes('new delhi')) return 'Cash Withdrawal - Delhi';
    if (descLower.includes('chennai')) return 'Cash Withdrawal - Chennai';
    if (descLower.includes('kolkata')) return 'Cash Withdrawal - Kolkata';
    return 'Cash Withdrawal - ATM';
  }
  
  // ========== TAX CATEGORIES ==========
  if (descLower.includes('tax') || 
      descLower.includes('gst') || 
      descLower.includes('tds') ||
      descLower.includes('income tax')) return 'Taxes';
  
  // ========== FEES & CHARGES CATEGORIES ==========
  if (descLower.includes('fee') || 
      descLower.includes('charge') || 
      descLower.includes('penalty') ||
      descLower.includes('commission') ||
      descLower.includes('annual charge') ||
      descLower.includes('maintenance charge')) return 'Bank Charges & Fees';
  
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

      console.log("Extracted PDF lines (first 30):", lines.slice(0, 30)); // Debug: show first 30 lines
      
      // Check for Standard Chartered bank statement
      const isStandardChartered = lines.some(line => 
        line.includes("standard chartered") || 
        line.includes("STANDARD CHARTERED") ||
        (line.includes("Date") && line.includes("Value Date") && line.includes("Description") && 
         line.includes("Withdrawal") && line.includes("Balance"))
      );
      
      if (isStandardChartered) {
        console.log("Detected Standard Chartered bank statement format");
        // Apply specialized Standard Chartered parsing logic
        const transactions = parseStandardCharteredStatement(lines);
        
        if (transactions.length > 0) {
          console.log(`Successfully extracted ${transactions.length} transactions from Standard Chartered statement`);
          return transactions;
        }
      }
      
      // If not Standard Chartered or if the specialized parser failed, continue with regular parsing
      console.log("Proceeding with generic statement parsing");
      
      // Determine if the PDF has a table-like structure
      const hasTabularStructure = detectTabularStructure(lines);
      console.log("Detected tabular structure:", hasTabularStructure);
      
      // ENHANCED APPROACH: Apply multiple strategies to detect transactions
      let transactions = [];
      
      // Try all extraction strategies and use the one that finds the most transactions
      
      // Strategy 1: Look for standard transaction patterns with date, description, amounts
      const patternTransactions = extractTransactionsUsingPatterns(lines);
      console.log(`Found ${patternTransactions.length} transactions using pattern detection`);
      
      if (patternTransactions.length > 0) {
        transactions = patternTransactions;
      }
      
      // Strategy 2: Try table-based extraction (header row + data rows)
      const tableTransactions = extractTransactionsFromTables(lines);
      console.log(`Found ${tableTransactions.length} transactions using table extraction`);
      
      if (tableTransactions.length > patternTransactions.length) {
        transactions = tableTransactions;
      }
      
      // Strategy 3: Line-by-line extraction for less structured formats
      const lineByLineTransactions = extractTransactionsLineByLine(lines);
      console.log(`Found ${lineByLineTransactions.length} transactions using line-by-line extraction`);
      
      if (lineByLineTransactions.length > transactions.length) {
        transactions = lineByLineTransactions;
      }
      
      // Strategy 4: Attempt space-separated column detection
      const columnTransactions = extractTransactionsFromSpaceSeparatedColumns(lines);
      console.log(`Found ${columnTransactions.length} transactions using space-separated columns`);
      
      if (columnTransactions.length > transactions.length) {
        transactions = columnTransactions;
      }
      
      // If no transactions were found, attempt one more desperate approach with minimal validation
      if (transactions.length === 0) {
        console.log("No transactions found with standard methods. Attempting minimal validation approach.");
        const minimalTransactions = extractTransactionsWithMinimalValidation(lines);
        console.log(`Found ${minimalTransactions.length} transactions using minimal validation`);
        transactions = minimalTransactions;
      }
      
      // If we still couldn't find any transactions, try manual format detection
      if (transactions.length === 0) {
        console.log("Trying manual format detection...");
        
        // Find lines that look like they might contain dates and amounts
        const candidateLines = lines.filter(line => {
          // Check for date-like pattern
          const hasDate = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/.test(line);
          // Check for amount-like pattern
          const hasAmount = /\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/.test(line);
          return hasDate && hasAmount;
        });
        
        if (candidateLines.length > 0) {
          console.log("Found candidate lines:", candidateLines.slice(0, 5));
          
          // Instead of using browser confirm, throw a special error that can be
          // handled by the UI if needed
          if (candidateLines.length > 0) {
            setError(`Automatic detection failed. Found ${candidateLines.length} potential transaction lines. Try uploading in Excel format instead.`);
            // Process just the first 20 lines as a best-effort approach
            const processingLines = candidateLines.slice(0, 20);
            transactions = processingLines.map(line => {
              // Extract first date-like pattern
              const dateMatch = line.match(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/);
              const date = dateMatch ? dateMatch[0] : '';
              
              // Extract first amount-like pattern
              const amountMatch = line.match(/\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/);
              const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : 0;
              
              // Use the rest as description
              let description = line;
              if (dateMatch) description = description.replace(dateMatch[0], '');
              if (amountMatch) description = description.replace(amountMatch[0], '');
              description = description.trim();
              
              return {
                date,
                description,
                debit: amount > 0 ? amount : 0,
                credit: 0,
                category: ''
              };
            });
          }
        }
      }
      
      if (transactions.length === 0) {
        // Provide more detailed diagnostic information
        const sampleText = lines.slice(0, 50).join('\n');
        console.log("Sample text from PDF:", sampleText);
        
        throw new Error(
          "Could not identify transaction data in this PDF format. " + 
          "Please check if this is a supported bank statement format or try an Excel/CSV export instead."
        );
      }
      
      return transactions;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Error parsing PDF: ${error.message}`);
    }
  };
  
  // New function to parse Standard Chartered bank statements specifically
  const parseStandardCharteredStatement = (lines) => {
    const transactions = [];
    
    console.log("Standard Chartered PDF parsing started, lines:", lines.length);
    
    // Debug: Log first 50 lines to understand structure
    console.log("First 50 lines:");
    for (let i = 0; i < Math.min(50, lines.length); i++) {
      console.log(`${i}: ${lines[i]}`);
    }
    
    // Step 1: Find the transaction table header
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for the exact table header pattern
      if (line.includes("Date") && 
          (line.includes("Value Date") || line.includes("Value")) && 
          line.includes("Description") && 
          (line.includes("Cheque") || line.includes("Withdrawal") || line.includes("Deposit"))) {
        headerIndex = i;
        console.log("Found table header at line", i, ":", line);
        break;
      }
    }
    
    if (headerIndex === -1) {
      console.log("Failed to find transaction table header");
      return [];
    }
    
    // Step 2: Determine column positions from the header line
    const headerLine = lines[headerIndex];
    
    // Find exact column positions
    const getColumnPosition = (columnName) => {
      return headerLine.indexOf(columnName);
    };
    
    // Get positions of each column (using both possible names)
    const datePos = getColumnPosition("Date");
    const valueDatePos = Math.max(getColumnPosition("Value Date"), getColumnPosition("Value"));
    const descPos = getColumnPosition("Description");
    const chequePos = getColumnPosition("Cheque");
    const depositPos = getColumnPosition("Deposit");
    const withdrawalPos = getColumnPosition("Withdrawal");
    const balancePos = getColumnPosition("Balance");
    
    console.log("Column positions:", {
      datePos,
      valueDatePos,
      descPos,
      chequePos,
      depositPos,
      withdrawalPos,
      balancePos
    });
    
    // Make sure we found the essential columns
    if (datePos === -1 || descPos === -1 || 
        (depositPos === -1 && withdrawalPos === -1)) {
      console.log("Missing essential columns in table header");
      return [];
    }
    
    // Step 3: Find where the table ends
    let tableEndIndex = lines.length;
    
    // Look for markers that indicate the end of the transaction table
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("total") || 
          line.includes("reward points statement") || 
          line.includes("dear client") || 
          line.includes("ministry of home affairs") ||
          line.includes("reward points earned") ||
          line.includes("opening balance") && line.includes("closing balance")) {
        tableEndIndex = i;
        console.log("Found table end at line", i, ":", lines[i]);
        break;
      }
    }
    
    console.log(`Processing transaction table from line ${headerIndex + 1} to ${tableEndIndex - 1}`);
    
    // Step 4: Extract transactions
    for (let i = headerIndex + 1; i < tableEndIndex; i++) {
      const line = lines[i];
      if (!line || line.trim().length < 10) continue;
      
      // Skip lines that are clearly not transactions
      if (line.toLowerCase().includes("total") || 
          line.toLowerCase().includes("balance forward") ||
          line.toLowerCase().includes("opening balance") ||
          line.toLowerCase().includes("closing balance")) {
        continue;
      }
      
      // Verify this line contains a date before processing
      // Check for common date formats (DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY)
      const datePattern = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3}\s+\d{4})\b/;
      const dateMatch = line.match(datePattern);
      
      if (!dateMatch) {
        console.log(`Line ${i} doesn't seem to be a transaction (no date):`, line);
        continue;
      }
      
      // Extract data from each column based on positions
      let date = "";
      let description = "";
      let deposit = 0;
      let withdrawal = 0;
      
      // Extract date
      if (datePos >= 0) {
        // Find the date within the date column area
        const dateEndPos = valueDatePos > datePos ? valueDatePos : descPos;
        const dateSection = line.substring(datePos, dateEndPos).trim();
        const dateMatch = dateSection.match(datePattern);
        if (dateMatch) {
          date = dateMatch[0];
        }
      }
      
      // Extract description
      if (descPos >= 0) {
        const descEndPos = chequePos > descPos ? chequePos : 
                          (depositPos > descPos ? depositPos : 
                           (withdrawalPos > descPos ? withdrawalPos : balancePos));
        if (descEndPos > descPos) {
          description = line.substring(descPos, descEndPos).trim();
        }
      }
      
      // Extract deposit amount
      if (depositPos >= 0) {
        const depositEndPos = withdrawalPos > depositPos ? withdrawalPos : 
                             (balancePos > depositPos ? balancePos : line.length);
        const depositSection = line.substring(depositPos, depositEndPos).trim();
        const amountMatch = depositSection.match(/\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/);
        if (amountMatch) {
          const cleanedAmount = amountMatch[0].replace(/,/g, '');
          deposit = parseFloat(cleanedAmount);
        }
      }
      
      // Extract withdrawal amount
      if (withdrawalPos >= 0) {
        const withdrawalEndPos = balancePos > withdrawalPos ? balancePos : line.length;
        const withdrawalSection = line.substring(withdrawalPos, withdrawalEndPos).trim();
        const amountMatch = withdrawalSection.match(/\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/);
        if (amountMatch) {
          const cleanedAmount = amountMatch[0].replace(/,/g, '');
          withdrawal = parseFloat(cleanedAmount);
        }
      }
      
      // Add transaction if we have valid data
      if (date && description && (deposit > 0 || withdrawal > 0)) {
        console.log(`Found transaction: Date: ${date}, Description: ${description}, Deposit: ${deposit}, Withdrawal: ${withdrawal}`);
        transactions.push({
          date,
          description,
          debit: withdrawal,
          credit: deposit,
          category: '' // Will be set later
        });
      } else {
        console.log(`Skipping invalid/incomplete line ${i}:`, line);
      }
    }
    
    console.log(`Extracted ${transactions.length} transactions from Standard Chartered statement`);
    
    if (transactions.length === 0) {
      console.log("No transactions found. Showing sample of statement lines:");
      for (let i = headerIndex; i < Math.min(headerIndex + 10, tableEndIndex); i++) {
        console.log(`Line ${i}: ${lines[i]}`);
      }
    }
    
    return transactions;
  };

  // Detect if the PDF has a table-like structure
  const detectTabularStructure = (lines) => {
    // Look for consistently spaced content which suggests a table
    let spacingPatterns = 0;
    
    // Check a sample of lines for consistent spacing
    const sampleSize = Math.min(20, lines.length);
    for (let i = 0; i < sampleSize; i++) {
      const line = lines[i];
      // Count space sequences (2+ spaces) that might indicate column separators
      const spaceSeqs = (line.match(/\s{2,}/g) || []).length;
      if (spaceSeqs >= 3) {
        spacingPatterns++;
      }
    }
    
    // If more than 30% of sampled lines have spacing patterns, it might be tabular
    return spacingPatterns > (sampleSize * 0.3);
  };

  // Extract transactions using pattern matching
  const extractTransactionsUsingPatterns = (lines) => {
    const transactions = [];
    const datePatterns = [
      /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/, // DD/MM/YYYY
      /\b(\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/, // YYYY/MM/DD
      /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/  // DD MMM YYYY
    ];
    
    const amountPattern = /\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for date
      let dateMatch = null;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateMatch = match;
          break;
        }
      }
      
      if (!dateMatch) continue;
      
      // Look for amount patterns
      const amountMatches = [...line.matchAll(new RegExp(amountPattern, 'g'))];
      if (amountMatches.length < 1) continue;
      
      // Extract description - everything between date and first amount
      const dateEndPos = dateMatch.index + dateMatch[0].length;
      const descriptionEndPos = amountMatches[0].index;
      let description = '';
      
      if (descriptionEndPos > dateEndPos) {
        description = line.substring(dateEndPos, descriptionEndPos).trim();
      } else {
        // If amount comes before description, try to find description after
        description = line.substring(dateEndPos).trim();
      }
      
      // Try to determine if amount is debit or credit
      let debit = 0;
      let credit = 0;
      
      // Simple heuristic - often the last amount is the transaction amount
      const lastAmount = amountMatches[amountMatches.length - 1];
      const amountValue = parseFloat(lastAmount[0].replace(/,/g, ''));
      
      // If description contains hints of payment/withdrawal, treat as debit
      if (description.toLowerCase().includes('withdraw') || 
          description.toLowerCase().includes('payment') ||
          description.toLowerCase().includes('debit') ||
          description.toLowerCase().includes('purchase') ||
          description.toLowerCase().includes('atm') ||
          description.toLowerCase().includes('upi')) {
        debit = amountValue;
      } else if (description.toLowerCase().includes('deposit') || 
                 description.toLowerCase().includes('credit') ||
                 description.toLowerCase().includes('salary') ||
                 description.toLowerCase().includes('interest')) {
        credit = amountValue;
      } else {
        // If no clear indicator, make a best guess
        // In tabular statements, usually amount position indicates debit/credit
        if (amountMatches.length >= 2) {
          debit = parseFloat(amountMatches[0][0].replace(/,/g, ''));
          credit = parseFloat(amountMatches[1][0].replace(/,/g, ''));
        } else {
          // Default case: treat as debit
          debit = amountValue;
        }
      }
      
      transactions.push({
        date: dateMatch[0],
        description,
        debit: debit || 0,
        credit: credit || 0,
        category: '' // Will be set later
      });
    }
    
    return transactions;
  };

  // Extract transactions from table-like structures
  const extractTransactionsFromTables = (lines) => {
    const transactions = [];
    let headerColumns = [];
    let columns = [];
    let dateCol = -1;
    let descCol = -1;
    let debitCol = -1;
    let creditCol = -1;
    let amountCol = -1;

    // Find header row by counting keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const keywords = ['date', 'description', 'debit', 'credit', 'amount', 'withdrawal', 'deposit'];
      let keywordCount = 0;
      
      keywords.forEach(keyword => {
        if (line.includes(keyword)) keywordCount++;
      });
      
      if (keywordCount >= 3) {
        // Found header row
        headerColumns = line.split(/\s+/).filter(Boolean);
        
        // Find column positions
        headerColumns.forEach((col, index) => {
          const colLower = col.toLowerCase();
          if (colLower.includes('date')) dateCol = index;
          if (colLower.includes('desc') || colLower.includes('narr') || colLower.includes('part')) descCol = index;
          if (colLower.includes('debit') || colLower.includes('withdrawal') || colLower.includes('dr')) debitCol = index;
          if (colLower.includes('credit') || colLower.includes('deposit') || colLower.includes('cr')) creditCol = index;
          if (colLower.includes('amount')) amountCol = index;
        });
        
        break;
      }
    }

    // Process data rows
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      columns = line.split(/\s+/).filter(Boolean);
      if (columns.length < 3) continue;
      
      let date = columns[dateCol];
      let description = columns[descCol];
      let debit = 0;
      let credit = 0;
      
      // Handle amount column if present
      if (amountCol !== -1) {
        const amount = parseFloat(columns[amountCol].replace(/[,₹]/g, '')) || 0;
        
        // Determine if debit or credit based on:
        // 1. Column header (if it indicates DR/CR)
        // 2. Description text (e.g., "UPI" usually means debit)
        // 3. Default to debit if can't determine
        const isDebit = 
          (headerColumns[amountCol]?.toLowerCase().includes('dr') || 
           headerColumns[amountCol]?.toLowerCase().includes('debit') ||
           headerColumns[amountCol]?.toLowerCase().includes('withdrawal')) ||
          (!headerColumns[amountCol]?.toLowerCase().includes('cr') && 
           !headerColumns[amountCol]?.toLowerCase().includes('credit') &&
           !headerColumns[amountCol]?.toLowerCase().includes('deposit') &&
           (description.toLowerCase().includes('upi') || 
            description.toLowerCase().includes('withdrawal') ||
            description.toLowerCase().includes('debit')));
        
        if (isDebit) {
          debit = amount;
        } else {
          credit = amount;
        }
      } else {
        // Separate debit/credit columns
        if (debitCol !== -1) {
          debit = parseFloat(columns[debitCol].replace(/[,₹]/g, '')) || 0;
        }
        if (creditCol !== -1) {
          credit = parseFloat(columns[creditCol].replace(/[,₹]/g, '')) || 0;
        }
      }
      
      // Only add if we have valid data
      if (date && description && (debit > 0 || credit > 0)) {
        transactions.push({
          date,
          description,
          debit,
          credit,
          category: '' // Will be set later
        });
      }
    }
    
    return transactions;
  };

  // Extract transactions line by line
  const extractTransactionsLineByLine = (lines) => {
    const transactions = [];
    const datePatterns = [
      /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/, // DD/MM/YYYY
      /\b(\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/, // YYYY/MM/DD
      /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/  // DD MMM YYYY
    ];
    
    const amountPattern = /\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/;
    
    let currentTransaction = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for date
      let dateMatch = null;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateMatch = match;
          break;
        }
      }
      
      if (dateMatch) {
        // Start a new transaction
        if (currentTransaction) {
          transactions.push(currentTransaction);
        }
        currentTransaction = {
          date: dateMatch[0],
          description: '',
          debit: 0,
          credit: 0,
          category: '' // Will be set later
        };
      }
      
      if (currentTransaction) {
        // Append to description
        currentTransaction.description += ' ' + line;
        
        // Look for amount patterns
        const amountMatches = [...line.matchAll(new RegExp(amountPattern, 'g'))];
        if (amountMatches.length > 0) {
          // Try to determine if amount is debit or credit
          const amountValue = parseFloat(amountMatches[0][0].replace(/,/g, ''));
          
          // If description contains hints of payment/withdrawal, treat as debit
          if (currentTransaction.description.toLowerCase().includes('withdraw') || 
              currentTransaction.description.toLowerCase().includes('payment') ||
              currentTransaction.description.toLowerCase().includes('debit') ||
              currentTransaction.description.toLowerCase().includes('purchase') ||
              currentTransaction.description.toLowerCase().includes('atm') ||
              currentTransaction.description.toLowerCase().includes('upi')) {
            currentTransaction.debit = amountValue;
          } else if (currentTransaction.description.toLowerCase().includes('deposit') || 
                     currentTransaction.description.toLowerCase().includes('credit') ||
                     currentTransaction.description.toLowerCase().includes('salary') ||
                     currentTransaction.description.toLowerCase().includes('interest')) {
            currentTransaction.credit = amountValue;
          } else {
            // If no clear indicator, make a best guess
            // In line-by-line statements, usually the first amount is debit
            if (currentTransaction.debit === 0) {
              currentTransaction.debit = amountValue;
            } else {
              currentTransaction.credit = amountValue;
            }
          }
        }
      }
    }
    
    // Add the last transaction
    if (currentTransaction) {
      transactions.push(currentTransaction);
    }
    
    return transactions;
  };

  // Extract transactions from space-separated columns
  const extractTransactionsFromSpaceSeparatedColumns = (lines) => {
    const transactions = [];
    const datePatterns = [
      /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/, // DD/MM/YYYY
      /\b(\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/, // YYYY/MM/DD
      /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/  // DD MMM YYYY
    ];
    
    const amountPattern = /\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for date
      let dateMatch = null;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateMatch = match;
          break;
        }
      }
      
      if (!dateMatch) continue;
      
      // Look for amount patterns
      const amountMatches = [...line.matchAll(new RegExp(amountPattern, 'g'))];
      if (amountMatches.length < 1) continue;
      
      // Extract description - everything between date and first amount
      const dateEndPos = dateMatch.index + dateMatch[0].length;
      const descriptionEndPos = amountMatches[0].index;
      let description = '';
      
      if (descriptionEndPos > dateEndPos) {
        description = line.substring(dateEndPos, descriptionEndPos).trim();
      } else {
        // If amount comes before description, try to find description after
        description = line.substring(dateEndPos).trim();
      }
      
      // Try to determine if amount is debit or credit
      let debit = 0;
      let credit = 0;
      
      // Simple heuristic - often the last amount is the transaction amount
      const lastAmount = amountMatches[amountMatches.length - 1];
      const amountValue = parseFloat(lastAmount[0].replace(/,/g, ''));
      
      // If description contains hints of payment/withdrawal, treat as debit
      if (description.toLowerCase().includes('withdraw') || 
          description.toLowerCase().includes('payment') ||
          description.toLowerCase().includes('debit') ||
          description.toLowerCase().includes('purchase') ||
          description.toLowerCase().includes('atm') ||
          description.toLowerCase().includes('upi')) {
        debit = amountValue;
      } else if (description.toLowerCase().includes('deposit') || 
                 description.toLowerCase().includes('credit') ||
                 description.toLowerCase().includes('salary') ||
                 description.toLowerCase().includes('interest')) {
        credit = amountValue;
      } else {
        // If no clear indicator, make a best guess
        // In space-separated columns, usually the first amount is debit
        if (amountMatches.length >= 2) {
          debit = parseFloat(amountMatches[0][0].replace(/,/g, ''));
          credit = parseFloat(amountMatches[1][0].replace(/,/g, ''));
        } else {
          // Default case: treat as debit
          debit = amountValue;
        }
      }
      
      transactions.push({
        date: dateMatch[0],
        description,
        debit: debit || 0,
        credit: credit || 0,
        category: '' // Will be set later
      });
    }
    
    return transactions;
  };

  // Extract transactions with minimal validation
  const extractTransactionsWithMinimalValidation = (lines) => {
    const transactions = [];
    const datePatterns = [
      /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/, // DD/MM/YYYY
      /\b(\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2})\b/, // YYYY/MM/DD
      /\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\b/  // DD MMM YYYY
    ];
    
    const amountPattern = /\b(\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{0,2})?)\b/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for date
      let dateMatch = null;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateMatch = match;
          break;
        }
      }
      
      if (!dateMatch) continue;
      
      // Look for amount patterns
      const amountMatches = [...line.matchAll(new RegExp(amountPattern, 'g'))];
      if (amountMatches.length < 1) continue;
      
      // Extract description - everything between date and first amount
      const dateEndPos = dateMatch.index + dateMatch[0].length;
      const descriptionEndPos = amountMatches[0].index;
      let description = '';
      
      if (descriptionEndPos > dateEndPos) {
        description = line.substring(dateEndPos, descriptionEndPos).trim();
      } else {
        // If amount comes before description, try to find description after
        description = line.substring(dateEndPos).trim();
      }
      
      // Try to determine if amount is debit or credit
      let debit = 0;
      let credit = 0;
      
      // Simple heuristic - often the last amount is the transaction amount
      const lastAmount = amountMatches[amountMatches.length - 1];
      const amountValue = parseFloat(lastAmount[0].replace(/,/g, ''));
      
      // If description contains hints of payment/withdrawal, treat as debit
      if (description.toLowerCase().includes('withdraw') || 
          description.toLowerCase().includes('payment') ||
          description.toLowerCase().includes('debit') ||
          description.toLowerCase().includes('purchase') ||
          description.toLowerCase().includes('atm') ||
          description.toLowerCase().includes('upi')) {
        debit = amountValue;
      } else if (description.toLowerCase().includes('deposit') || 
                 description.toLowerCase().includes('credit') ||
                 description.toLowerCase().includes('salary') ||
                 description.toLowerCase().includes('interest')) {
        credit = amountValue;
      } else {
        // If no clear indicator, make a best guess
        // In minimal validation, usually the first amount is debit
        if (amountMatches.length >= 2) {
          debit = parseFloat(amountMatches[0][0].replace(/,/g, ''));
          credit = parseFloat(amountMatches[1][0].replace(/,/g, ''));
        } else {
          // Default case: treat as debit
          debit = amountValue;
        }
      }
      
      transactions.push({
        date: dateMatch[0],
        description,
        debit: debit || 0,
        credit: credit || 0,
        category: '' // Will be set later
      });
    }
    
    return transactions;
  };

  // Process transactions from CSV data
  const processTransactions = (data) => {
    return data.map(row => ({
      date: row.Date || row.date || row.TransactionDate || row.TRANSACTION_DATE,
      description: row.Description || row.description || row.Narration || row.NARRATION || row.Particulars || row.PARTICULARS,
      debit: parseFloat(row.Debit || row.debit || row.Withdrawal || row.WITHDRAWAL || row.DR || '0') || 0,
      credit: parseFloat(row.Credit || row.credit || row.Deposit || row.DEPOSIT || row.CR || '0') || 0,
      category: '' // Will be set later
    })).filter(transaction => 
      transaction.date && 
      (transaction.debit > 0 || transaction.credit > 0) &&
      transaction.description
    );
  };

  // Process data from Excel file
  const processExcelData = (data) => {
    // Skip empty rows and find header row
    let headerRow = -1;
    const headerKeywords = ['date', 'description', 'narration', 'particulars', 'debit', 'credit', 'withdrawal', 'deposit'];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(cell => String(cell).toLowerCase());
      let keywordCount = 0;
      
      for (const keyword of headerKeywords) {
        if (row.some(cell => cell.includes(keyword))) {
          keywordCount++;
        }
      }
      
      if (keywordCount >= 3) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1) {
      throw new Error('Could not find header row in Excel file');
    }
    
    // Map header columns to standardized names
    const headers = data[headerRow].map(header => String(header).toLowerCase());
    const columnMap = {
      date: headers.findIndex(header => 
        header.includes('date') || header.includes('txn date') || header.includes('transaction date')
      ),
      description: headers.findIndex(header => 
        header.includes('description') || header.includes('narration') || header.includes('particulars')
      ),
      debit: headers.findIndex(header => 
        header.includes('debit') || header.includes('withdrawal') || header.includes('dr')
      ),
      credit: headers.findIndex(header => 
        header.includes('credit') || header.includes('deposit') || header.includes('cr')
      )
    };
    
    // Extract transactions
    const transactions = [];
    
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const transaction = {
        date: row[columnMap.date],
        description: row[columnMap.description],
        debit: parseFloat(row[columnMap.debit] || '0') || 0,
        credit: parseFloat(row[columnMap.credit] || '0') || 0,
        category: '' // Will be set later
      };
      
      // Only add if we have valid data
      if (transaction.date && 
          transaction.description && 
          (transaction.debit > 0 || transaction.credit > 0)) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  };

  // Analyze transactions and generate insights
  const analyzeTransactions = (transactions) => {
    // Add categories to transactions
    transactions.forEach(transaction => {
      transaction.category = extractCategory(transaction.description, transaction.credit - transaction.debit);
    });
    
    // Calculate totals
    const totalIncome = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalExpenses = transactions.reduce((sum, t) => sum + t.debit, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    // Get top expenses and income
    const topExpenses = [...transactions]
      .filter(t => t.debit > 0)
      .sort((a, b) => b.debit - a.debit)
      .slice(0, 10);
    
    const topIncome = [...transactions]
      .filter(t => t.credit > 0)
      .sort((a, b) => b.credit - a.credit)
      .slice(0, 10);
    
    // Category analysis
    const categorySpending = {};
    const categoryIncome = {};
    
    transactions.forEach(t => {
      if (t.debit > 0) {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.debit;
      }
      if (t.credit > 0) {
        categoryIncome[t.category] = (categoryIncome[t.category] || 0) + t.credit;
      }
    });
    
    const categorySpendingArray = Object.entries(categorySpending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const categoryIncomeArray = Object.entries(categoryIncome)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Monthly analysis
    const monthlyData = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          income: 0,
          expenses: 0,
          transactions: 0
        };
      }
      
      monthlyData[month].income += t.credit;
      monthlyData[month].expenses += t.debit;
      monthlyData[month].transactions++;
    });
    
    const monthlyAnalysis = Object.values(monthlyData).map(month => ({
      ...month,
      savings: month.income - month.expenses,
      savingsRate: month.income > 0 ? ((month.income - month.expenses) / month.income) * 100 : 0
    }));
    
    // Day of week analysis
    const dayOfWeek = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const day = days[date.getDay()];
      dayOfWeek[day] = (dayOfWeek[day] || 0) + t.debit;
    });
    
    const dayOfWeekArray = days.map(day => ({
      name: day,
      value: dayOfWeek[day] || 0
    }));
    
    // Find recurring transactions
    const transactionPatterns = {};
    
    transactions.forEach(t => {
      const key = `${t.description}-${t.debit > 0 ? 'expense' : 'income'}`;
      if (!transactionPatterns[key]) {
        transactionPatterns[key] = {
          description: t.description,
          type: t.debit > 0 ? 'expense' : 'income',
          occurrences: 0,
          totalDebit: 0,
          totalCredit: 0
        };
      }
      
      transactionPatterns[key].occurrences++;
      transactionPatterns[key].totalDebit += t.debit;
      transactionPatterns[key].totalCredit += t.credit;
    });
    
    const potentialRecurring = Object.values(transactionPatterns)
      .filter(p => p.occurrences >= 2)
      .map(p => ({
        ...p,
        avgDebit: p.totalDebit / p.occurrences,
        avgCredit: p.totalCredit / p.occurrences
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
    
    // Generate insights
    const insights = [];
    
    // Savings rate insight
    if (savingsRate > 20) {
      insights.push({
        type: 'positive',
        text: `Great job! Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%.`
      });
    } else if (savingsRate > 0) {
      insights.push({
        type: 'info',
        text: `Your savings rate is ${savingsRate.toFixed(1)}%. Try to increase it to at least 20%.`
      });
    } else {
      insights.push({
        type: 'warning',
        text: 'Your expenses exceed your income. Consider creating a budget to manage spending.'
      });
    }
    
    // Category insights
    const topExpenseCategory = categorySpendingArray[0];
    if (topExpenseCategory) {
      insights.push({
        type: 'info',
        text: `Your highest spending category is ${topExpenseCategory.name} at ${formatCurrency(topExpenseCategory.value)}.`
      });
    }
    
    // Recurring payment insights
    if (potentialRecurring.length > 0) {
      const recurringExpenses = potentialRecurring.filter(p => p.type === 'expense');
      const totalRecurring = recurringExpenses.reduce((sum, p) => sum + p.avgDebit, 0);
      
      insights.push({
        type: 'info',
        text: `You have ${recurringExpenses.length} recurring expenses totaling approximately ${formatCurrency(totalRecurring)} per month.`
      });
    }
    
    // Monthly trend insights
    if (monthlyAnalysis.length >= 2) {
      const lastMonth = monthlyAnalysis[monthlyAnalysis.length - 1];
      const previousMonth = monthlyAnalysis[monthlyAnalysis.length - 2];
      
      if (lastMonth.expenses > previousMonth.expenses) {
        insights.push({
          type: 'warning',
          text: `Your expenses increased by ${formatCurrency(lastMonth.expenses - previousMonth.expenses)} compared to last month.`
        });
      } else {
        insights.push({
          type: 'positive',
          text: `Your expenses decreased by ${formatCurrency(previousMonth.expenses - lastMonth.expenses)} compared to last month.`
        });
      }
    }
    
    // Add suggestions
    insights.push({
      type: 'suggestion',
      text: 'Consider setting up automatic transfers to a savings account to maintain consistent savings.'
    });
    
    if (dayOfWeekArray.some(d => d.value > totalExpenses * 0.2)) {
      insights.push({
        type: 'suggestion',
        text: 'Your spending varies significantly by day of the week. Planning purchases could help distribute expenses more evenly.'
      });
    }
    
    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      topExpenses,
      topIncome,
      categorySpendingArray,
      categoryIncomeArray,
      monthlyAnalysis,
      dayOfWeekArray,
      potentialRecurring,
      insights
    };
  };

  // Handle file analysis
  const analyzeStatement = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      let transactions = [];
      
      // Determine file type and process accordingly
      if (file.name.toLowerCase().endsWith('.pdf')) {
        transactions = await parsePDF(file);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true });
        transactions = processTransactions(result.data);
      } else if (file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        transactions = processExcelData(data);
      } else {
        throw new Error('Unsupported file format. Please upload a PDF, CSV, or Excel file.');
      }
      
      // Analyze transactions
      const results = analyzeTransactions(transactions);
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Error analyzing statement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')] bg-cover bg-center opacity-10 animate-pulse-slow"></div>
      
      {/* Futuristic Circuit Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMSAxaDR2NEgxem00IDBoNHY0SDV6bTI0IDBo-NGg0djRoLTR6bTQgMGg0djRoLTR6bTEyIDBoNHY0aC00ek0xIDVoNHY0SDF6bTggMGg0djRIOXptOCAwaDR2NEgxN3ptMTIgMGg0djRoLTR6bTggMGg0djRoLTR6TTEgOWg0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em00IDBoNHY0aC00em0xMiAwaDR2NGgtNHptOCAwaDR2NGgtNHpNMSAxM2g0djRIMXptNCAwaDR2NEg1em0yNCAwaDR2NGgtNHptMTYgMGg0djRoLTR6TTEgMTdoNHY0SDV6TTEgMTdoNHY0SDV6bTI0IDBoNHY0aC00em0xNiAwaDR2NGgtNHpNMSAyMWg0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em0xMiAwaDR2NGgtNHptMTIgMGg0djRoLTR6TTEgMjVoNHY0SDV6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTExIDBoNHY0aC00ek0xIDI5aDR2NEgxem00IDBoNHY0SDV6bTggMGg0djRoLTR6bTEyIDBoNHY0aC00em0xMiAwaDR2NGgtNHpNMSAzM2g0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em00IDBoNHY0aC00em04IDBoNHY0aC00ek0xIDM3aDR2NEgxem04IDBoNHY0SDl6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTQgMGg0djRoLTR6TTEgNDFoNHY0SDF6bTQgMGg0djRINXptOCAwaDR2NGgtNHptNCAwaDR2NGgtNHptOCAwaDR2NGgtNHptMTIgMGg0djRoLTR6TTEgNDVoNHY0SDV6bTggMGg0djRIOXptMTIgMGg0djRoLTR6bTQgMGg0djRoLTR6bTggMGg0djRoLTR6Ij48L3BhdGg+PC9zdmc+')] opacity-5"></div>
      
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
          <div className="flex justify-center items-center">
            <svg width="280" height="70" viewBox="0 0 280 70" className="filter drop-shadow-xl">
              {/* Glowing background effect */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#00f2fe" />
                </linearGradient>
                <linearGradient id="pixelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#43e97b" />
                  <stop offset="100%" stopColor="#38f9d7" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
                  <feFlood floodColor="#4facfe" floodOpacity="0.7" result="flood" />
                  <feComposite in="flood" in2="SourceGraphic" operator="in" result="mask" />
                  <feGaussianBlur in="mask" stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Pixel Art Money Bag */}
              <g filter="url(#glow)" className="animate-pulse-slow">
                {/* Pixel Money Bag */}
                <rect x="20" y="18" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="18" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="32" y="18" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="38" y="18" width="6" height="6" fill="url(#pixelGradient)" />
                
                <rect x="14" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="20" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="32" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="38" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="44" y="24" width="6" height="6" fill="url(#pixelGradient)" />
                
                <rect x="14" y="30" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="20" y="30" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="30" width="6" height="6" fill="url(#logoGradient)" />
                <rect x="32" y="30" width="6" height="6" fill="url(#logoGradient)" />
                <rect x="38" y="30" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="44" y="30" width="6" height="6" fill="url(#pixelGradient)" />
                
                <rect x="14" y="36" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="20" y="36" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="36" width="6" height="6" fill="url(#logoGradient)" />
                <rect x="32" y="36" width="6" height="6" fill="url(#logoGradient)" />
                <rect x="38" y="36" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="44" y="36" width="6" height="6" fill="url(#pixelGradient)" />
                
                <rect x="14" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="20" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="32" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="38" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="44" y="42" width="6" height="6" fill="url(#pixelGradient)" />
                
                <rect x="20" y="48" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="26" y="48" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="32" y="48" width="6" height="6" fill="url(#pixelGradient)" />
                <rect x="38" y="48" width="6" height="6" fill="url(#pixelGradient)" />
              </g>
              
              {/* Pixel Text for "PIXEL" */}
              <g filter="url(#glow)">
                {/* P */}
                <rect x="60" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="65" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="70" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="60" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="75" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="60" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="65" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="70" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="60" y="35" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="60" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="60" y="45" width="5" height="5" fill="url(#logoGradient)" />
                
                {/* I */}
                <rect x="85" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="85" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="85" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="85" y="35" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="85" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="85" y="45" width="5" height="5" fill="url(#logoGradient)" />
                
                {/* X */}
                <rect x="95" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="115" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="100" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="110" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="105" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="105" y="35" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="100" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="110" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="95" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="115" y="45" width="5" height="5" fill="url(#logoGradient)" />
                
                {/* E */}
                <rect x="125" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="130" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="135" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="140" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="125" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="125" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="130" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="135" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="125" y="35" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="125" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="125" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="130" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="135" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="140" y="45" width="5" height="5" fill="url(#logoGradient)" />
                
                {/* L */}
                <rect x="150" y="20" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="150" y="25" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="150" y="30" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="150" y="35" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="150" y="40" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="150" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="155" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="160" y="45" width="5" height="5" fill="url(#logoGradient)" />
                <rect x="165" y="45" width="5" height="5" fill="url(#logoGradient)" />
              </g>
              
              {/* WEALTH text */}
              <text x="180" y="40" fontFamily="Courier New" fontSize="24" fontWeight="bold" fill="white" filter="url(#glow)">
                WEALTH
              </text>
              
              {/* Pixel dollar sign symbols */}
              <g className="animate-ping-slow">
                <rect x="12" y="16" width="3" height="3" fill="#4facfe" opacity="0.7" />
                <rect x="54" y="52" width="3" height="3" fill="#4facfe" opacity="0.7" />
                <rect x="170" y="20" width="3" height="3" fill="#4facfe" opacity="0.7" />
              </g>
            </svg>
          </div>
        </motion.h1>
        <PrivacyNotice />

        {/* File Upload Section */}
        <motion.div 
          className="mb-8 p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          variants={itemVariants}
        >
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-lg" style={{ 
            background: 'linear-gradient(45deg, rgba(79, 172, 254, 0.4), rgba(0, 242, 254, 0.4))',
            filter: 'blur(8px)',
            opacity: 0.3,
            animation: 'pulse-slow 4s infinite'
          }}></div>
          
          <div className="relative">
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
                className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 relative overflow-hidden ${
                  !file 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-transparent border border-blue-400 hover:border-purple-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Futuristic button background */}
                {file && !loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-500/80 z-0" 
                    style={{ 
                      backgroundSize: "200% 200%",
                      animation: "gradient-shift 3s linear infinite"
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Analyze Statement
                    </>
                  )}
                </span>
              </motion.button>
            </div>
            {error && <motion.p className="mt-4 text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
          </div>
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