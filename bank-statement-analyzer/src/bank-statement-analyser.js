import React, { useState, useCallback, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, LabelList
} from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import _ from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';
import PrivacyModal from './PrivacyModal';
import { getAnalytics, logEvent } from "firebase/analytics";
import PrivacyNotice from './PrivacyNotice';
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

const getCategoryIcon = (category) => {
  const categoryIcons = {
    // Expense categories
    'Food & Dining': 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    'Transportation': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    'Shopping': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    'Bills & Utilities': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    'Entertainment': 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    'Healthcare': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    'Education': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'Travel': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    'Investment': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    // Income categories
    'Salary': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    'Freelance': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    'Investments': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'Rent': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    'Other Income': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };

  // Fallback icon (a generic circle)
  const fallbackIcon = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';

  // Try to match the category with any of the predefined icons
  const matchedCategory = Object.keys(categoryIcons).find(key => 
    category.toLowerCase().includes(key.toLowerCase())
  );

  return matchedCategory ? categoryIcons[matchedCategory] : fallbackIcon;
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqgRf6rgOlZ1DBsCl9wbKmfV6mueEvcVI",
  authDomain: "bank-statement-analyser-b6ffc.firebaseapp.com",
  projectId: "bank-statement-analyser-b6ffc",
  storageBucket: "bank-statement-analyser-b6ffc.firebasestorage.app",
  messagingSenderId: "449666648469",
  appId: "1:449666648469:web:2c57dde8e023f8e7e60e9c",
  measurementId: "G-R4LLN4ZT4L"
};

const BankStatementAnalyzer = () => {
  // Add this at the beginning of your BankStatementAnalyzer component
// Right after the component definition but before your useEffect hooks


  // Hidden form for Netlify - Add this right after your component definition
  useEffect(() => {
    // Create hidden form elements that Netlify can detect during build
    const hiddenFormHTML = `
      <form name="feedback" netlify netlify-honeypot="bot-field" hidden>
        <input type="text" name="emoji" />
        <textarea name="comment"></textarea>
        <input type="text" name="bot-field" />
      </form>
      
      <form name="contact" netlify netlify-honeypot="bot-field" hidden>
        <input type="text" name="name" />
        <input type="email" name="email" />
        <textarea name="message"></textarea>
        <input type="text" name="bot-field" />
      </form>
    `;
    
    // Create a div to hold our hidden forms
    const hiddenFormsContainer = document.createElement('div');
    hiddenFormsContainer.style.display = 'none';
    hiddenFormsContainer.innerHTML = hiddenFormHTML;
    
    // Add it to the document body
    document.body.appendChild(hiddenFormsContainer);
    
    // Clean up function to remove the forms when component unmounts
    return () => {
      document.body.removeChild(hiddenFormsContainer);
    };
  }, []);
  // Inject the animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = logoAnimationStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
    
  }, []);

  // Add this after the existing style injection
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ${logoAnimationStyles}
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes particle-float {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) rotate(360deg); opacity: 0; }
      }
      
      @keyframes glow-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(79, 172, 254, 0.3); }
        50% { box-shadow: 0 0 40px rgba(79, 172, 254, 0.5); }
      }
      
      .upload-particle {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(45deg, #4facfe, #00f2fe);
        pointer-events: none;
        animation: particle-float 3s ease-in-out infinite;
      }
      
      .welcome-text {
        animation: float 3s ease-in-out infinite;
      }
      
      .upload-area-hover {
        transition: all 0.3s ease;
      }
      
      .upload-area-hover:hover {
        transform: scale(1.02);
        box-shadow: 0 0 30px rgba(79, 172, 254, 0.4);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ${logoAnimationStyles}
      
      @keyframes cyber-glow {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(79, 172, 254, 0.3),
                      inset 0 0 20px rgba(79, 172, 254, 0.3);
        }
        50% { 
          box-shadow: 0 0 40px rgba(79, 172, 254, 0.5),
                      inset 0 0 40px rgba(79, 172, 254, 0.5);
        }
      }

      @keyframes cyber-line {
        0% { 
          transform: translateX(-100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% { 
          transform: translateX(100%);
          opacity: 0;
        }
      }

      @keyframes matrix-rain {
        0% { 
          transform: translateY(-100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% { 
          transform: translateY(100%);
          opacity: 0;
        }
      }

      .cyber-container {
        position: relative;
        background: linear-gradient(135deg, rgba(16, 24, 39, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%);
        border: 2px solid rgba(79, 172, 254, 0.5);
        border-radius: 1rem;
        overflow: hidden;
        animation: cyber-glow 3s infinite;
      }

      .cyber-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #4facfe);
        animation: cyber-line 3s infinite;
      }

      .cyber-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: -100%;
        width: 100%;
        height: 2px;
        background: linear-gradient(270deg, transparent, #00f2fe);
        animation: cyber-line 3s infinite;
        animation-delay: 1.5s;
      }

      .matrix-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        opacity: 0.1;
      }

      .matrix-line {
        position: absolute;
        width: 2px;
        height: 100%;
        background: linear-gradient(180deg, transparent, #4facfe);
        animation: matrix-rain 2s infinite;
      }

      .cyber-button {
        background: linear-gradient(135deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2));
        border: 1px solid rgba(79, 172, 254, 0.5);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }

      .cyber-button:hover {
        background: linear-gradient(135deg, rgba(79, 172, 254, 0.4), rgba(0, 242, 254, 0.4));
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(79, 172, 254, 0.5);
      }

      .cyber-text {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Add matrix background effect
  const createMatrixBackground = () => {
    const lines = [];
    for (let i = 0; i < 10; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 1 + Math.random();
      lines.push(
        <div
          key={i}
          className="matrix-line"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        />
      );
    }
    return lines;
  };

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackEmoji, setFeedbackEmoji] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  const [userName, setUserName] = useState('');

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
// Enhanced category extraction function with more detailed patterns
const extractCategory = useCallback((description, amount) => {
  if (!description) return 'Uncategorized';
  
  const descLower = String(description).toLowerCase();
  const isCredit = amount > 0;
  
  // ========== INCOME CATEGORIES ==========
  if (isCredit) {
    // Salary and income - expanded patterns
    if (descLower.includes('salary') || 
        descLower.includes('sal ') || 
        descLower.includes('income') || 
        descLower.includes('stipend') ||
        descLower.includes('commission') ||
        descLower.includes('bonus') ||
        descLower.includes('pension') ||
        descLower.includes('paytm') ||
        descLower.includes('payment received') ||
        descLower.includes('credit/') ||
        descLower.includes('payroll') ||
        descLower.includes('compensation') ||
        descLower.includes('wage') ||
        descLower.includes('earnings') ||
        /cr\/[^\/]*sal/i.test(descLower)) return 'Income - Salary';
    
    // Rental income - expanded
    if ((descLower.includes('rent') && isCredit) ||
        descLower.includes('lease payment') ||
        descLower.includes('tenant')) return 'Income - Rental';
    
    // Interest income - expanded
    if ((descLower.includes('interest') || 
         descLower.includes('int cr') ||
         descLower.includes('intt') ||
         descLower.includes('int.cr') ||
         descLower.includes('savings interest') ||
         descLower.includes('fd interest')) && isCredit) return 'Income - Interest';
    
    // Refunds and cashbacks - expanded
    if (descLower.includes('refund') || 
        descLower.includes('cashback') || 
        descLower.includes('reversal') ||
        descLower.includes('reimbursement') ||
        descLower.includes('return') ||
        descLower.includes('chargeback') ||
        descLower.includes('repayment to you') ||
        descLower.includes('money back')) return 'Income - Refunds';
    
    // Dividends and investments returns
    if (descLower.includes('dividend') ||
        descLower.includes('investment return') ||
        descLower.includes('capital gain') ||
        (descLower.includes('return') && descLower.includes('investment'))) return 'Income - Dividends';
        
    // Gifts and transfers received
    if ((descLower.includes('gift') || 
         descLower.includes('transfer from') ||
         descLower.includes('imps from') ||
         descLower.includes('neft from') ||
         descLower.includes('upi/') ||
         descLower.includes('received from ')) && isCredit) return 'Income - Gifts & Transfers';
  }
  
  // ========== INVESTMENT CATEGORIES ==========
  // Digital Gold and Silver
  if (descLower.includes('gullak') || 
      descLower.includes('gullakmoney') ||
      descLower.includes('jar') || 
      descLower.includes('jarmoney') ||
      descLower.includes('mmtc') ||
      descLower.includes('augmont') ||
      descLower.includes('digital gold')) return 'Investments - Digital Gold';

  // Bonds and Debt Instruments
  if (descLower.includes('wintwealth') || 
      descLower.includes('winvest') ||
      descLower.includes('bond purchase') ||
      descLower.includes('bonds') ||
      descLower.includes('debenture') ||
      descLower.includes('fixed maturity plan') ||
      descLower.includes('debt fund') ||
      descLower.includes('ncds')) return 'Investments - Bonds';

  // Direct Stocks
  if (descLower.includes('zerodha') || 
      descLower.includes('groww') || 
      descLower.includes('upstox') ||
      descLower.includes('icici direct') ||
      descLower.includes('angel broking') ||
      descLower.includes('sharekhan') ||
      descLower.includes('geojit') ||
      descLower.includes('iifl') ||
      descLower.includes('motilal oswal') ||
      descLower.includes('5paisa') ||
      descLower.includes('indiabulls') ||
      descLower.includes('stock purchase') ||
      descLower.includes('equity delivery') ||
      descLower.includes('hdfc sec') ||
      descLower.includes('kotak securities') ||
      descLower.includes('axis direct')) return 'Investments - Direct Stocks';
  
  // Mutual Funds - expanded patterns
  if (descLower.includes('bse limited') || 
      (descLower.includes('bse') && descLower.includes('tsez')) ||
      descLower.includes('kfintech') ||
      descLower.includes('cams') ||
      descLower.includes('sip') ||
      descLower.includes('mutual fund') ||
      descLower.includes('mf ') ||
      descLower.includes('systematic investment') ||
      descLower.includes('aditya birla sun life') ||
      descLower.includes('axis mutual') ||
      descLower.includes('idfc mutual') ||
      descLower.includes('dsp') ||
      descLower.includes('icici prudential') ||
      descLower.includes('kotak mahindra mutual') ||
      descLower.includes('uti mutual') ||
      descLower.includes('sbi mutual') ||
      descLower.includes('hdfc mutual') ||
      descLower.includes('nippon mutual') ||
      descLower.includes('franklin templeton') ||
      descLower.includes('mirae asset') ||
      descLower.includes('tata mutual')) return 'Investments - Mutual Funds';
  
  // Fixed Deposits - expanded patterns
  if ((descLower.includes('northeast') && descLower.includes('small') && descLower.includes('fin')) ||
      descLower.includes('fd ') || 
      descLower.includes('fixed deposit') ||
      descLower.includes('deposit opening') ||
      descLower.includes('term deposit') ||
      descLower.includes('fd renewal') ||
      descLower.includes('fixed dep') ||
      descLower.includes('deposit booked') ||
      descLower.includes('deposit placement')) return 'Investments - Fixed Deposit';
  
  // Retirement Investments - expanded
  if (descLower.includes('ppf') || 
      descLower.includes('nps') || 
      descLower.includes('epf') ||
      descLower.includes('provident fund') ||
      descLower.includes('pension fund') ||
      descLower.includes('retirement') ||
      descLower.includes('annuity') ||
      descLower.includes('pf contribution') ||
      descLower.includes('employees provident') ||
      descLower.includes('superannuation')) return 'Investments - Retirement';
  
  // Precious Metals - expanded
  if (descLower.includes('gold') || 
      descLower.includes('silver') ||
      descLower.includes('bullion') ||
      descLower.includes('precious metal') ||
      descLower.includes('sovereign gold bond') ||
      descLower.includes('sgb')) return 'Investments - Precious Metals';
  
  // Cryptocurrency - expanded
  if (descLower.includes('crypto') || 
      descLower.includes('bitcoin') || 
      descLower.includes('ethereum') || 
      descLower.includes('wazirx') ||
      descLower.includes('coindcx') ||
      descLower.includes('coinswitch') ||
      descLower.includes('zebpay') ||
      descLower.includes('binance') ||
      descLower.includes('tether') ||
      descLower.includes('dogecoin') ||
      descLower.includes('btc') ||
      descLower.includes('eth') ||
      descLower.includes('usdt')) return 'Investments - Cryptocurrency';
    
  // General investments - more patterns
  if (descLower.includes('invest') || 
      descLower.includes('dividend') ||
      descLower.includes('mutual') ||
      descLower.includes('stock') ||
      descLower.includes('shares') ||
      descLower.includes('securities') ||
      descLower.includes('broker') ||
      descLower.includes('portfolio')) return 'Investments - General';
  
  // P2P Lending
  if (descLower.includes('lendbox') || 
      descLower.includes('lendenclub') ||
      descLower.includes('liquiloans') ||
      descLower.includes('grip invest') ||
      descLower.includes('p2p lending') ||
      descLower.includes('peer to peer lend')) return 'Investments - P2P Lending';
  
  // ========== INSURANCE CATEGORIES ==========
  if (descLower.includes('life insurance') || 
      descLower.includes('lic') || 
      descLower.includes('hdfc life') ||
      descLower.includes('sbi life') ||
      descLower.includes('icici prulife') ||
      descLower.includes('max life') ||
      descLower.includes('pnb metlife') ||
      descLower.includes('term insurance') ||
      descLower.includes('bajaj allianz life')) return 'Insurance - Life';
  
  if (descLower.includes('health insurance') || 
      descLower.includes('star health') || 
      descLower.includes('apollo') ||
      descLower.includes('max bupa') ||
      descLower.includes('aditya birla health') ||
      descLower.includes('hdfc ergo health') ||
      descLower.includes('icici lombard health') ||
      descLower.includes('niva bupa') ||
      descLower.includes('care health')) return 'Insurance - Health';
  
  if (descLower.includes('car insurance') || 
      descLower.includes('vehicle insurance') || 
      descLower.includes('two wheeler') ||
      descLower.includes('motor insurance') ||
      descLower.includes('bike insurance') ||
      descLower.includes('acko') ||
      descLower.includes('digit insurance') ||
      descLower.includes('bajaj allianz general') ||
      descLower.includes('tata aig motor')) return 'Insurance - Vehicle';
  
  if (descLower.includes('insurance') || 
      descLower.includes('policy') ||
      descLower.includes('premium payment')) return 'Insurance - General';
  
  // ========== LOAN CATEGORIES ==========
  if (descLower.includes('home loan') || 
      descLower.includes('mortgage') ||
      descLower.includes('housing finance') ||
      descLower.includes('housing loan') ||
      descLower.includes('property loan')) return 'Loans - Home Loan';
  
  if (descLower.includes('personal loan') || 
      descLower.includes('pl emi') ||
      descLower.includes('consumer loan') ||
      descLower.includes('bajaj finserv') ||
      descLower.includes('moneyview') ||
      descLower.includes('earlysal') ||
      descLower.includes('early salary') ||
      descLower.includes('hdfc pl')) return 'Loans - Personal Loan';
  
  if (descLower.includes('car loan') || 
      descLower.includes('vehicle loan') || 
      descLower.includes('auto loan') ||
      descLower.includes('two wheeler loan') ||
      descLower.includes('bike loan') ||
      descLower.includes('cholamandalam') ||
      descLower.includes('hdfc auto')) return 'Loans - Vehicle Loan';
  
  if (descLower.includes('education loan') || 
      descLower.includes('student loan') ||
      descLower.includes('study loan') ||
      descLower.includes('credila') ||
      descLower.includes('vidya lakshmi')) return 'Loans - Education Loan';
  
  if (descLower.includes('loan') || 
      descLower.includes('emi') || 
      descLower.includes('equated') ||
      descLower.includes('installment') ||
      descLower.includes('repayment')) return 'Loans - Other EMIs';
    
  // ========== DAILY EXPENSE CATEGORIES ==========
  // Food & Dining - expanded with popular food apps and restaurants
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
      descLower.includes('mcdonalds') ||
      descLower.includes('kfc') ||
      descLower.includes('dominos') ||
      descLower.includes('subway') ||
      descLower.includes('starbucks') ||
      descLower.includes('burger king') ||
      descLower.includes('dunkin') ||
      descLower.includes('costa coffee') ||
      descLower.includes('chai point') ||
      descLower.includes('fasoos') ||
      descLower.includes('eatfit') ||
      descLower.includes('freshmenu') ||
      descLower.includes('eatsure') ||
      descLower.includes('lunchbox') ||
      descLower.includes('dining')) return 'Expenses - Food & Dining';
    
  // Shopping - expanded with popular online and offline retailers
  if (descLower.includes('amazon') || 
      descLower.includes('flipkart') ||
      descLower.includes('myntra') || 
      descLower.includes('shopping') ||
      descLower.includes('retail') || 
      descLower.includes('store') ||
      descLower.includes('mall') ||
      descLower.includes('bigbasket') ||
      descLower.includes('grofers') ||
      descLower.includes('blinkit') ||
      descLower.includes('reliance') ||
      descLower.includes('dmart') ||
      descLower.includes('ajio') ||
      descLower.includes('nykaa') ||
      descLower.includes('tata cliq') ||
      descLower.includes('meesho') ||
      descLower.includes('snapdeal') ||
      descLower.includes('lifestyle') ||
      descLower.includes('shoppers stop') ||
      descLower.includes('westside') ||
      descLower.includes('lenskart') ||
      descLower.includes('ikea') ||
      descLower.includes('decathlon')) return 'Expenses - Shopping';
    
  // Entertainment - expanded with streaming platforms and activities
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
      descLower.includes('gaana') ||
      descLower.includes('wynk') ||
      descLower.includes('zee5') ||
      descLower.includes('sony liv') ||
      descLower.includes('voot') ||
      descLower.includes('jiocinema') ||
      descLower.includes('apple tv') ||
      descLower.includes('youtube premium') ||
      descLower.includes('gaming') ||
      descLower.includes('playstation') ||
      descLower.includes('xbox') ||
      descLower.includes('steam') ||
      descLower.includes('epic games') ||
      descLower.includes('concert') ||
      descLower.includes('theatre') ||
      descLower.includes('amusement park')) return 'Expenses - Entertainment';
    
  // Transportation - expanded with ride-sharing and fuel
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
      descLower.includes('yulu') ||
      descLower.includes('cab') ||
      descLower.includes('taxi') ||
      descLower.includes('auto') ||
      descLower.includes('hp') ||
      descLower.includes('indian oil') ||
      descLower.includes('iocl') ||
      descLower.includes('bharat petroleum') ||
      descLower.includes('bpcl') ||
      descLower.includes('hindustan petroleum') ||
      descLower.includes('hpcl') ||
      descLower.includes('namma metro') ||
      descLower.includes('dmrc') ||
      descLower.includes('best bus') ||
      descLower.includes('tsrtc') ||
      descLower.includes('ksrtc') ||
      descLower.includes('apsrtc')) return 'Expenses - Transportation';
    
  // Healthcare - expanded with pharmacies and hospitals
  if (descLower.includes('medical') || 
      descLower.includes('hospital') ||
      descLower.includes('pharmacy') || 
      descLower.includes('doctor') ||
      descLower.includes('health') ||
      descLower.includes('apollo') ||
      descLower.includes('medplus') ||
      descLower.includes('netmeds') ||
      descLower.includes('pharmeasy') ||
      descLower.includes('clinic') ||
      descLower.includes('1mg') ||
      descLower.includes('wellness') ||
      descLower.includes('diagnostic') ||
      descLower.includes('lab test') ||
      descLower.includes('medlife') ||
      descLower.includes('dentist') ||
      descLower.includes('physiotherapy') ||
      descLower.includes('tata 1mg') ||
      descLower.includes('fortis') ||
      descLower.includes('max healthcare') ||
      descLower.includes('manipal') ||
      descLower.includes('aiims') ||
      descLower.includes('cipla') ||
      descLower.includes('metropolis') ||
      descLower.includes('thyrocare') ||
      descLower.includes('lal path')) return 'Expenses - Healthcare';
    
  // Education - expanded with ed-tech platforms
  if (descLower.includes('education') || 
      descLower.includes('school') ||
      descLower.includes('college') || 
      descLower.includes('tuition') ||
      descLower.includes('course') ||
      descLower.includes('class') ||
      descLower.includes('coaching') ||
      descLower.includes('udemy') ||
      descLower.includes('coursera') ||
      descLower.includes('byjus') ||
      descLower.includes('upgrad') ||
      descLower.includes('unacademy') ||
      descLower.includes('vedantu') ||
      descLower.includes('great learning') ||
      descLower.includes('simplilearn') ||
      descLower.includes('whitehat') ||
      descLower.includes('university') ||
      descLower.includes('institute') ||
      descLower.includes('academy') ||
      descLower.includes('lecture') ||
      descLower.includes('exam fee') ||
      descLower.includes('books')) return 'Expenses - Education';
    
  // Utilities - expanded with ISPs and mobile carriers
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
      descLower.includes('vodafone') ||
      descLower.includes('idea') ||
      descLower.includes('bsnl') ||
      descLower.includes('mtnl') ||
      descLower.includes('tata power') ||
      descLower.includes('adani electricity') ||
      descLower.includes('reliance energy') ||
      descLower.includes('torrent power') ||
      descLower.includes('mahanagar gas') ||
      descLower.includes('indraprastha gas') ||
      descLower.includes('act fiber') ||
      descLower.includes('excitel') ||
      descLower.includes('hathway') ||
      descLower.includes('tikona') ||
      descLower.includes('tata sky') ||
      descLower.includes('dish tv') ||
      descLower.includes('d2h')) return 'Expenses - Utilities';
    
  // Travel - expanded with OTAs and hotels
  if (descLower.includes('travel') || 
      descLower.includes('flight') ||
      (descLower.includes('hotel') && !descLower.includes('food')) || 
      descLower.includes('holiday') ||
      descLower.includes('trip') || 
      descLower.includes('tour') ||
      descLower.includes('makemytrip') ||
      descLower.includes('goibibo') ||
      descLower.includes('easemytrip') ||
      descLower.includes('oyo') ||
      descLower.includes('airbnb') ||
      descLower.includes('ixigo') ||
      descLower.includes('cleartrip') ||
      descLower.includes('yatra') ||
      descLower.includes('agoda') ||
      descLower.includes('trivago') ||
      descLower.includes('booking.com') ||
      descLower.includes('zostel') ||
      descLower.includes('treebo') ||
      descLower.includes('fab hotels') ||
      descLower.includes('indigo') ||
      descLower.includes('spicejet') ||
      descLower.includes('air india') ||
      descLower.includes('vistara') ||
      descLower.includes('go first') ||
      descLower.includes('akasa air') ||
      descLower.includes('taj hotel') ||
      descLower.includes('itc hotel') ||
      descLower.includes('leela') ||
      descLower.includes('oberoi')) return 'Expenses - Travel';
      
  // Gifts & Donations - expanded
  if (descLower.includes('gift') || 
      descLower.includes('donation') ||
      descLower.includes('charity') ||
      descLower.includes('present') ||
      descLower.includes('contribute') ||
      descLower.includes('offering') ||
      descLower.includes('temple') ||
      descLower.includes('fundraiser') ||
      descLower.includes('relief fund') ||
      descLower.includes('welfare') ||
      descLower.includes('ngo')) return 'Expenses - Gifts & Donations';
      
  // Home & Maintenance - expanded with furniture and appliances
  if (descLower.includes('maintenance') || 
      descLower.includes('repair') ||
      descLower.includes('renovation') ||
      descLower.includes('furniture') ||
      descLower.includes('appliance') ||
      descLower.includes('cleaning') ||
      descLower.includes('plumber') ||
      descLower.includes('electrician') ||
      descLower.includes('carpenter') ||
      descLower.includes('painter') ||
      descLower.includes('urban company') ||
      descLower.includes('homeservice') ||
      descLower.includes('home centre') ||
      descLower.includes('pepperfry') ||
      descLower.includes('urban ladder') ||
      descLower.includes('home town') ||
      descLower.includes('godrej interio')) return 'Expenses - Home & Maintenance';
  
  // Rent & Housing
  if (descLower.includes('rent') ||
      descLower.includes('lease') ||
      descLower.includes('society maintenance') ||
      descLower.includes('apartment') ||
      descLower.includes('house') ||
      descLower.includes('property tax') ||
      descLower.includes('nobroker') ||
      descLower.includes('magicbricks') ||
      descLower.includes('99acres') ||
      descLower.includes('housing.com')) return 'Expenses - Rent & Housing';
      
  // Personal Care & Beauty
  if (descLower.includes('salon') ||
      descLower.includes('spa') ||
      descLower.includes('haircut') ||
      descLower.includes('beauty') ||
      descLower.includes('cosmetics') ||
      descLower.includes('grooming') ||
      descLower.includes('makeup') ||
      descLower.includes('wellness') ||
      descLower.includes('skincare') ||
      descLower.includes('nykaa') ||
      descLower.includes('purplle') ||
      descLower.includes('myntra beauty') ||
      descLower.includes('lakme')) return 'Expenses - Personal Care';
      
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
      descLower.includes('cwl') ||
      descLower.includes('cash at atm') ||
      descLower.includes('cash with')) {
    // Categorize by location if available
    if (descLower.includes('bengaluru') || descLower.includes('bangalore')) return 'Cash Withdrawal - Bangalore';
    if (descLower.includes('mumbai') || descLower.includes('bombay')) return 'Cash Withdrawal - Mumbai';
    if (descLower.includes('delhi') || descLower.includes('new delhi')) return 'Cash Withdrawal - Delhi';
    if (descLower.includes('chennai')) return 'Cash Withdrawal - Chennai';
    if (descLower.includes('kolkata')) return 'Cash Withdrawal - Kolkata';
    if (descLower.includes('hyderabad')) return 'Cash Withdrawal - Hyderabad';
    if (descLower.includes('pune')) return 'Cash Withdrawal - Pune';
    if (descLower.includes('ahmedabad')) return 'Cash Withdrawal - Ahmedabad';
    return 'Cash Withdrawal - ATM';
  }
  
  // ========== TAX CATEGORIES ==========
  if (descLower.includes('tax') || 
      descLower.includes('gst') || 
      descLower.includes('tds') ||
      descLower.includes('income tax') ||
      descLower.includes('advance tax') ||
      descLower.includes('self assessment tax') ||
      descLower.includes('itr') ||
      descLower.includes('tax return')) return 'Taxes';
  
  // ========== FEES & CHARGES CATEGORIES ==========
  if (descLower.includes('fee') || 
      descLower.includes('charge') || 
      descLower.includes('penalty') ||
      descLower.includes('commission') ||
      descLower.includes('annual charge') ||
      descLower.includes('maintenance charge') ||
      descLower.includes('service charge') ||
      descLower.includes('membership fee') ||
      descLower.includes('processing fee') ||
      descLower.includes('late payment') ||
      descLower.includes('non maintenance')) return 'Bank Charges & Fees';
  
  // ========== MISCELLANEOUS SPECIFIC CATEGORIES ==========
  // Digital Subscriptions
  if (descLower.includes('subscription') ||
      descLower.includes('renewal') ||
      descLower.includes('membership') ||
      descLower.includes('amazon prime') ||
      descLower.includes('google one') ||
      descLower.includes('apple one') ||
      descLower.includes('microsoft') ||
      descLower.includes('office 365') ||
      descLower.includes('google play') ||
      descLower.includes('app store') ||
      descLower.includes('adobe') ||
      descLower.includes('canva') ||
      descLower.includes('norton') ||
      descLower.includes('mcafee') ||
      descLower.includes('vpn')) return 'Expenses - Digital Subscriptions';
      
  // Sports & Fitness
  if (descLower.includes('gym') ||
      descLower.includes('fitness') ||
      descLower.includes('sports') ||
      descLower.includes('workout') ||
      descLower.includes('yoga') ||
      descLower.includes('cult') ||
      descLower.includes('cure.fit') ||
      descLower.includes('decathlon') ||
      descLower.includes('sport equipment') ||
      descLower.includes('health club') ||
      descLower.includes('swimming') ||
      descLower.includes('cycling') ||
      descLower.includes('trekking') ||
      descLower.includes('marathon')) return 'Expenses - Sports & Fitness';
      
  // Communication
  if (descLower.includes('recharge') ||
      descLower.includes('airtel') ||
      descLower.includes('jio') ||
      descLower.includes('vi') ||
      descLower.includes('vodafone') ||
      descLower.includes('idea') ||
      descLower.includes('bsnl') ||
      descLower.includes('mobile bill') ||
      descLower.includes('phone bill') ||
      descLower.includes('prepaid') ||
      descLower.includes('postpaid') ||
      descLower.includes('data pack')) return 'Expenses - Communication';

      // ========== SPECIALIZED PAYMENT METHODS ==========
  // Credit Card Payments
  if (descLower.includes('credit card payment') ||
  descLower.includes('cc payment') ||
  descLower.includes('card payment') ||
  descLower.includes('credit card bill') ||
  descLower.includes('cc bill payment') ||
  descLower.includes('payment to credit card')) return 'Payments - Credit Card';

// Bill Payments
if (descLower.includes('bill payment') ||
  descLower.includes('billpay') ||
  descLower.includes('billdesk') ||
  descLower.includes('paytm bill') ||
  descLower.includes('phonepe bill') ||
  descLower.includes('gpay bill') ||
  descLower.includes('payment of bill') ||
  descLower.includes('payu')) return 'Payments - Bills';

// ========== WALLET TRANSACTIONS ==========
// Digital Wallets
if (descLower.includes('paytm') ||
  descLower.includes('phonepe') ||
  descLower.includes('amazon pay') ||
  descLower.includes('gpay') ||
  descLower.includes('google pay') ||
  descLower.includes('mobikwik') ||
  descLower.includes('freecharge') ||
  descLower.includes('ola money') ||
  descLower.includes('paypal') ||
  descLower.includes('wallet')) {
  
  if (isCredit) return 'Wallet - Money Added';
  return 'Wallet - Payment';
}

// ========== E-COMMERCE PLATFORMS ==========
// Major E-commerce Platforms
if (descLower.includes('amazon') ||
  descLower.includes('flipkart') ||
  descLower.includes('myntra') ||
  descLower.includes('ajio') ||
  descLower.includes('nykaa') ||
  descLower.includes('meesho') ||
  descLower.includes('snapdeal') ||
  descLower.includes('tata cliq')) return 'Shopping - Online';

// ========== FOOD DELIVERY ==========
// Food Delivery Services
if (descLower.includes('swiggy') ||
  descLower.includes('zomato') ||
  descLower.includes('food panda') ||
  descLower.includes('uber eats') ||
  descLower.includes('fasoos') ||
  descLower.includes('freshmenu')) return 'Food & Dining - Delivery';

// ========== GROCERY DELIVERY ==========
// Grocery Delivery Services
if (descLower.includes('bigbasket') ||
  descLower.includes('grofers') ||
  descLower.includes('blinkit') ||
  descLower.includes('supr daily') ||
  descLower.includes('milkbasket') ||
  descLower.includes('dmart ready') ||
  descLower.includes('jiomart') ||
  descLower.includes('nature\'s basket') ||
  descLower.includes('licious') ||
  descLower.includes('freshtohome')) return 'Shopping - Groceries';

// ========== RIDE SHARING ==========
// Ride Sharing Services
if (descLower.includes('uber') ||
  descLower.includes('ola') ||
  descLower.includes('rapido') ||
  descLower.includes('meru') ||
  descLower.includes('careem') ||
  descLower.includes('taxi') ||
  descLower.includes('cab')) return 'Transportation - Ride Sharing';

// ========== INTERNATIONAL TRANSACTIONS ==========
// Foreign Transactions
if (descLower.includes('forex') ||
  descLower.includes('foreign') ||
  descLower.includes('international') ||
  descLower.includes('remittance') ||
  descLower.includes('currency conversion') ||
  descLower.includes('exchange rate') ||
  descLower.includes('western union') ||
  descLower.includes('moneygram') ||
  descLower.includes('xoom')) return 'International - Foreign Exchange';
  
// ========== BUSINESS RELATED ==========
// Business Expenses
if (descLower.includes('office') ||
  descLower.includes('business') ||
  descLower.includes('corporate') ||
  descLower.includes('client') ||
  descLower.includes('vendor') ||
  descLower.includes('supplier') ||
  descLower.includes('professional') ||
  descLower.includes('consulting') ||
  descLower.includes('b2b')) return 'Business - Expenses';

// ========== FAMILY & RELATIONSHIPS ==========
// Family Related
if (descLower.includes('family') ||
  descLower.includes('child') ||
  descLower.includes('kid') ||
  descLower.includes('baby') ||
  descLower.includes('parent') ||
  descLower.includes('mother') ||
  descLower.includes('father') ||
  descLower.includes('spouse') ||
  descLower.includes('husband') ||
  descLower.includes('wife') ||
  descLower.includes('son') ||
  descLower.includes('daughter')) return 'Family - Related';
  
// ========== LUXURY & PREMIUM ==========
// Luxury Purchases
if (descLower.includes('luxury') ||
  descLower.includes('premium') ||
  descLower.includes('designer') ||
  descLower.includes('jewellery') ||
  descLower.includes('jewelry') ||
  descLower.includes('louis vuitton') ||
  descLower.includes('gucci') ||
  descLower.includes('prada') ||
  descLower.includes('rolex') ||
  descLower.includes('tiffany') ||
  descLower.includes('cartier') ||
  descLower.includes('tanishq') ||
  descLower.includes('titan')) return 'Shopping - Luxury';

// ========== TECH & GADGETS ==========
// Technology Purchases
if (descLower.includes('electronics') ||
  descLower.includes('gadget') ||
  descLower.includes('appliance') ||
  descLower.includes('tech') ||
  descLower.includes('laptop') ||
  descLower.includes('mobile phone') ||
  descLower.includes('smartphone') ||
  descLower.includes('tablet') ||
  descLower.includes('camera') ||
  descLower.includes('headphone') ||
  descLower.includes('speaker') ||
  descLower.includes('reliance digital') ||
  descLower.includes('croma') ||
  descLower.includes('vijay sales') ||
  descLower.includes('apple store') ||
  descLower.includes('samsung') ||
  descLower.includes('oneplus') ||
  descLower.includes('mi store')) return 'Shopping - Electronics';

// ========== SHARED PAYMENT APPS ==========
// Split payments and shared expenses
if (descLower.includes('splitwise') ||
  descLower.includes('split') ||
  descLower.includes('share expense') ||
  descLower.includes('share bill') ||
  descLower.includes('group expense')) return 'Payments - Split';

// ========== SPECIFIC INDIAN BANKS ==========
// Detect transfers to/from specific banks
if (descLower.includes('sbi') ||
  descLower.includes('state bank') ||
  descLower.includes('hdfc') ||
  descLower.includes('icici') ||
  descLower.includes('axis bank') ||
  descLower.includes('kotak') ||
  descLower.includes('yes bank') ||
  descLower.includes('idfc') ||
  descLower.includes('pnb') ||
  descLower.includes('punjab national') ||
  descLower.includes('bank of baroda') ||
  descLower.includes('union bank') ||
  descLower.includes('canara bank') ||
  descLower.includes('federal bank')) {
  
  if (isCredit) return 'Transfer - Received from Bank';
  return 'Transfer - Sent to Bank';
}

// ========== PERIODIC PAYMENTS ==========
// Detect monthly, quarterly, annual payments
if (descLower.includes('monthly') ||
  descLower.includes('quarterly') ||
  descLower.includes('annual') ||
  descLower.includes('yearly') ||
  descLower.includes('subscription') ||
  descLower.includes('recurring')) return 'Payments - Recurring';

// ========== FINTECH APPS ==========
// Popular fintech apps
if (descLower.includes('cred') ||
  descLower.includes('jupiter') ||
  descLower.includes('slice') ||
  descLower.includes('fi money') ||
  descLower.includes('niyo') ||
  descLower.includes('groww') ||
  descLower.includes('upstox') ||
  descLower.includes('smallcase') ||
  descLower.includes('zerodha')) return 'Fintech - Apps';

// ========== SALARY SPECIFIC ==========
// If description contains salary-specific terms
if (descLower.includes('salary') ||
  descLower.includes('compensation') ||
  descLower.includes('payroll') ||
  descLower.includes('pay slip') ||
  descLower.includes('wage') ||
  descLower.includes('stipend') ||
  descLower.includes('remuneration')) return 'Income - Salary';

// ========== LAST RESORT - INTELLIGENT GUESSING ==========
// Use amount patterns to guess the category when all else fails
if (isCredit) {
if (amount > 10000) return 'Income - Large Credit';
if (amount > 1000) return 'Income - Medium Credit';
return 'Income - Small Credit';
} else {
if (amount > 10000) return 'Expenses - Large Payment';
if (amount > 1000) return 'Expenses - Medium Payment';
return 'Expenses - Small Payment';
}

// We should never reach here, but just in case
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
      
      // Extract text from first few pages to look for name
      const pagesToCheck = Math.min(3, pdf.numPages);
      for (let i = 1; i <= pagesToCheck; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        // Look for common name patterns in bank statements
        const namePatterns = [
          /(?:name|customer)[:\s]+([a-zA-Z\s]+)/i,
          /(?:dear)[:\s]+(?:mr\.?|mrs\.?|ms\.?|dr\.?)?[:\s]*([a-zA-Z\s]+)/i,
          /(?:statement for)[:\s]+([a-zA-Z\s]+)/i,
          /(?:account holder)[:\s]+([a-zA-Z\s]+)/i
        ];
        
        for (const pattern of namePatterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            const possibleName = match[1].trim();
            // Validate name is reasonable (not too long, no numbers)
            if (possibleName.length > 2 && possibleName.length < 50 && !/\d/.test(possibleName)) {
              setUserName(possibleName);
              break;
            }
          }
        }
        
        text += pageText + '\n';
      }
      
      // Continue extracting remaining pages for transactions
      for (let i = pagesToCheck + 1; i <= pdf.numPages; i++) {
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
    
    // First, try to find the customer name in the first few rows
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i].map(cell => String(cell).toLowerCase());
      const rowStr = row.join(' ');
      
      // Look for name patterns with Mr/Mrs
      const namePatterns = [
        /mr\.?\s*([a-zA-Z\s]+)/i,
        /mrs\.?\s*([a-zA-Z\s]+)/i,
        /ms\.?\s*([a-zA-Z\s]+)/i,
        /name\s*:\s*([a-zA-Z\s]+)/i,
        /customer\s*:\s*([a-zA-Z\s]+)/i,
        /statement\s+for\s*:?\s*([a-zA-Z\s]+)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = rowStr.match(pattern);
        if (match && match[1]) {
          const possibleName = match[1].trim();
          // Validate name is reasonable (not too long, no numbers)
          if (possibleName.length > 2 && possibleName.length < 50 && !/\d/.test(possibleName)) {
            console.log('Found customer name:', possibleName);
            setUserName(possibleName);
            break;
          }
        }
      }
    }
    
    // Find header row
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
      
      // Handle date parsing here for Excel
      let dateValue = row[columnMap.date];
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          let year = parseInt(parts[2]);
          if (year < 100) {
            // For 2-digit years, assume 20xx for all years
            year += 2000;
          }
          dateValue = `${parts[0]}/${parts[1]}/${year}`;
        }
      }
      
      // Get description and check for additional name patterns in transaction descriptions
      const description = row[columnMap.description];
      if (description && !userName) {
        const descStr = String(description).toLowerCase();
        const namePatterns = [
          /mr\.?\s*([a-zA-Z\s]+)/i,
          /mrs\.?\s*([a-zA-Z\s]+)/i,
          /ms\.?\s*([a-zA-Z\s]+)/i
        ];
        
        for (const pattern of namePatterns) {
          const match = descStr.match(pattern);
          if (match && match[1]) {
            const possibleName = match[1].trim();
            if (possibleName.length > 2 && possibleName.length < 50 && !/\d/.test(possibleName)) {
              console.log('Found customer name in transaction:', possibleName);
              setUserName(possibleName);
              break;
            }
          }
        }
      }
      
      const transaction = {
        date: dateValue,
        description: description,
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
// 1. Add this improved date parsing function for Indian bank statement formats
// Add this function to your BankStatementAnalyzer component

/**
 * Improved date parser specifically designed for bank statement dates
 * Handles multiple formats including DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY
 */
const parseBankStatementDate = (dateString) => {
  if (!dateString) return null;
  
  // Convert to string if it's not already
  const rawDate = String(dateString).trim();
  
  // Get current date for future date validation
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();
  
  // Function to validate a parsed date isn't in the unreasonable future
  const isReasonableDate = (date) => {
    // Don't allow dates more than 1 month in the future
    if (date > new Date(currentYear, currentMonth + 1, currentDay)) {
      console.warn(`Rejecting future date: ${date.toDateString()} from ${rawDate}`);
      return false;
    }
    return true;
  };
  
  // Since we know the format is DD/MM/YY, prioritize this format
  if (rawDate.includes('/')) {
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      // Use DD/MM/YY format (confirmed by the user)
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      let year = parseInt(parts[2], 10);
      
      // Handle 2-digit years specifically for bank statements
      if (year < 100) {
        // For 2-digit years, we need to determine century
        // For bank statements from 2025, we need to handle:
        // - Recent years like "24" (2024), "23" (2023)
        // - Older years from the same century: "15" (2015), "08" (2008)
        
        // Use 2000 as base year for all 2-digit years, as bank statements
        // typically only show recent transactions
        year += 2000;
        
        // Additional safety check - ensure we're not creating future dates
        if (year > currentYear + 1) {
          console.warn(`Year ${year} from 2-digit "${parts[2]}" would be too far in the future, treating as invalid`);
          return null;
        }
      }
      
      // Validate the components to avoid invalid dates
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        // Ensure the date is valid and not in the unreasonable future
        if (!isNaN(date.getTime()) && isReasonableDate(date)) {
          console.log(`Parsed DD/MM/YY date: ${rawDate} → ${date.toDateString()}`);
          return date;
        }
      }
    }
  }
  
  // Try DD-MM-YYYY format
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      let year = parseInt(parts[2], 10);
      
      // Handle 2-digit years - prefer to interpret as recent past
      if (year < 100) {
        // Intelligently determine century
        if (year > 80) {
          // Likely 1900s
          year += 1900;
        } else {
          // Likely 2000s
          year += 2000;
        }
      }
      
      // Validate the components
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime()) && isReasonableDate(date)) {
          return date;
        }
      }
      
      // Try YYYY-MM-DD (ISO format)
      if (parts[0].length === 4) {
        const isoYear = parseInt(parts[0], 10);
        const isoMonth = parseInt(parts[1], 10) - 1;
        const isoDay = parseInt(parts[2], 10);
        
        if (isoDay >= 1 && isoDay <= 31 && isoMonth >= 0 && isoMonth <= 11) {
          const date = new Date(isoYear, isoMonth, isoDay);
          if (!isNaN(date.getTime()) && isReasonableDate(date)) {
            return date;
          }
        }
      }
    }
  }
  
  // Try DD MMM YYYY format (e.g. 01 Jan 2023)
  const datePattern = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/;
  const match = rawDate.match(datePattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames.indexOf(match[2]);
    const year = parseInt(match[3], 10);
    
    if (month !== -1 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) && isReasonableDate(date)) {
        return date;
      }
    }
  }
  
  // If we can't parse it, log a warning and return null
  console.warn(`Failed to parse date: "${rawDate}"`);
  return null;
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
    const totalInvestments = transactions.reduce((sum, t) => {
      // Consider transactions with keywords like 'investment', 'mutual fund', 'stock', etc.
      const isInvestment = t.description.toLowerCase().includes('investment') || 
                          t.description.toLowerCase().includes('mutual fund') ||
                          t.description.toLowerCase().includes('stock') ||
                          t.description.toLowerCase().includes('equity') ||
                          t.description.toLowerCase().includes('mf') ||
                          t.description.toLowerCase().includes('sip') ||
                          t.description.toLowerCase().includes('nse') ||
                          t.description.toLowerCase().includes('bse') ||
                          t.description.toLowerCase().includes('shares') ||
                          t.description.toLowerCase().includes('portfolio') ||
                          t.description.toLowerCase().includes('trading') ||
                          t.description.toLowerCase().includes('broker') ||
                          t.description.toLowerCase().includes('zerodha') ||
                          t.description.toLowerCase().includes('upstox') ||
                          t.description.toLowerCase().includes('angel') ||
                          t.description.toLowerCase().includes('icici direct') ||
                          t.description.toLowerCase().includes('hdfc sec') ||
                          t.description.toLowerCase().includes('kotak sec') ||
                          t.description.toLowerCase().includes('wintwealth') ||
                          t.description.toLowerCase().includes('axis sec');
      
      // Debug logging
      if (t.debit > 0 && isInvestment) {
        console.log('Investment detected:', {
          description: t.description,
          amount: t.debit,
          date: t.date
        });
      }
      
      return isInvestment ? sum + t.debit : sum;
    }, 0);
    
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
    
// Monthly analysis
const monthlyData = {};

// Additional safeguard - track and log possible abnormal data
const dateProblemTracker = {
  invalidDates: 0,
  futureDate: 0,
  oldDates: 0,
  processedDates: 0
};

// Get today's date for reference
const today = new Date();
console.log(`Today's date for reference: ${today.toDateString()}`);

transactions.forEach(t => {
  // Log raw date for debugging
  console.log(`Processing transaction date string: "${t.date}" (type: ${typeof t.date})`);
  
  // Parse the date using our improved function
  const date = parseBankStatementDate(t.date);
  
  // Skip transactions with invalid dates
  if (!date) {
    console.warn('Skipping transaction with invalid date:', t.date);
    dateProblemTracker.invalidDates++;
    return;
  }
  
  // Strict future date check (don't allow any dates in the future)
  if (date > today) {
    console.warn(`Skipping suspicious future date: ${date.toDateString()} from "${t.date}"`);
    dateProblemTracker.futureDate++;
    return; // Skip this transaction
  }
  
  // Check for very old dates (probably parsing errors)
  if (date.getFullYear() < today.getFullYear() - 10) {
    console.warn(`Suspiciously old date: ${date.toDateString()} from "${t.date}"`);
    dateProblemTracker.oldDates++;
    // Don't skip but track for investigation
  }
  
  dateProblemTracker.processedDates++;
  console.log(`Successfully parsed date: ${date.toDateString()} from "${t.date}"`);
  
  // Format the month-year string consistently (e.g., "March 2025")
  const month = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  // Initialize the month data if it doesn't exist
  if (!monthlyData[month]) {
    monthlyData[month] = {
      month,
      income: 0,
      expenses: 0,
      transactions: 0
    };
  }
  
  // Add transaction amounts (ensuring they're treated as numbers)
  monthlyData[month].income += Math.max(0, Number(t.credit) || 0);
  monthlyData[month].expenses += Math.max(0, Number(t.debit) || 0);
  monthlyData[month].transactions++;
});

// Log date processing statistics
console.log("Date processing statistics:", dateProblemTracker);
console.log("Months found:", Object.keys(monthlyData).join(", "));

// Convert to array and calculate derived values
const monthlyAnalysis = Object.values(monthlyData)
  .map(month => ({
    ...month,
    savings: Number(month.income) - Number(month.expenses),
    savingsRate: month.income > 0 
      ? ((Number(month.income) - Number(month.expenses)) / Number(month.income) * 100) 
      : 0
  }));
  monthlyAnalysis.sort((a, b) => {
    // Parse month-year strings into dates for proper chronological sorting
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const parseMonthYearString = (monthYearStr) => {
      const parts = monthYearStr.split(" ");
      if (parts.length !== 2) return new Date(); // Default fallback
      
      const monthName = parts[0];
      const year = parseInt(parts[1], 10);
      
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex === -1 || isNaN(year)) return new Date();
      
      return new Date(year, monthIndex, 1);
    };
    
    const dateA = parseMonthYearString(a.month);
    const dateB = parseMonthYearString(b.month);
    
    return dateA - dateB;
  });
  
    // Debug monthly data  
    console.log('Monthly Analysis Data:', monthlyAnalysis);
    
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
      const getMonthOverMonthInsight = (monthlyAnalysis) => {
        if (monthlyAnalysis.length < 2) {
          return {
            type: 'info',
            text: 'Not enough monthly data for month-over-month comparison.'
          };
        }
        
        // Get the last two months with valid data
        const lastMonth = monthlyAnalysis[monthlyAnalysis.length - 1];
        const previousMonth = monthlyAnalysis[monthlyAnalysis.length - 2];
        
        // Calculate changes
        const expenseChange = lastMonth.expenses - previousMonth.expenses;
        const incomeChange = lastMonth.income - previousMonth.income;
        const savingsChange = lastMonth.savings - previousMonth.savings;
        
        // Format currency for display
        const formatCurrency = (value) => {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(Math.abs(value));
        };
        
        // Generate insights
        const insights = [];
        
        // Expense insight
        if (Math.abs(expenseChange) > 0) {
          insights.push({
            type: expenseChange > 0 ? 'warning' : 'positive',
            text: `Your expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ${formatCurrency(expenseChange)} compared to last month.`
          });
        }
        
        // Income insight
        if (Math.abs(incomeChange) > 0) {
          insights.push({
            type: incomeChange > 0 ? 'positive' : 'info',
            text: `Your income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${formatCurrency(incomeChange)} compared to last month.`
          });
        }
        
        // Savings insight
        if (Math.abs(savingsChange) > 0) {
          insights.push({
            type: savingsChange > 0 ? 'positive' : 'warning',
            text: `Your savings ${savingsChange > 0 ? 'increased' : 'decreased'} by ${formatCurrency(savingsChange)} compared to last month.`
          });
        }
        
        return insights;
      };
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
    const monthOverMonthInsights = getMonthOverMonthInsight(monthlyAnalysis);
    if (Array.isArray(monthOverMonthInsights)) {
      insights.push(...monthOverMonthInsights);
    } else {
      insights.push(monthOverMonthInsights);
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
      totalInvestments,
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
        throw new Error('Unsupported file format. Please upload a CSV, or Excel file.');
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

  // Add this new function for particle animation
  const createParticle = (e) => {
    const particles = [];
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'upload-particle';
      const x = e.clientX;
      const y = e.clientY;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
      particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 100}px`);
      particles.push(particle);
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }
  };

  // Add useEffect for feedback timer
  useEffect(() => {
    let feedbackTimer;
    if (analysisResults && !hasGivenFeedback) {
      feedbackTimer = setTimeout(() => {
        setIsFeedbackModalOpen(true);
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(feedbackTimer);
  }, [analysisResults, hasGivenFeedback]);

  // Add feedback submission handler
  // Replace your existing handleFeedbackSubmit function with this one
const handleFeedbackSubmit = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!feedbackEmoji) return;
  
  // Create feedback data object
  const feedbackData = {
    'form-name': 'feedback',
    emoji: feedbackEmoji,
    comment: feedbackComment
  };

  try {
    // Show processing state
    setSubmitting(true); // Add this state variable to your component
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development mode handling
      console.log('Development mode - Feedback data:', feedbackData);
      
      // Simulate success in development mode
      setTimeout(() => {
        showNotification('✨ Thanks for the feedback! (Development Mode)', 'success');
        setIsFeedbackModalOpen(false);
        setHasGivenFeedback(true);
        setFeedbackEmoji('');
        setFeedbackComment('');
      }, 1000);
    } else {
      // Production mode - submit to Netlify
      const response = await fetch('/?form-name=feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(feedbackData).toString()
      });
      
      if (!response.ok) {
        throw new Error(`Form submission failed: ${response.status} ${response.statusText}`);
      }
      
      // Handle success
      showNotification('✨ Thanks for the feedback!', 'success');
      setIsFeedbackModalOpen(false);
      setHasGivenFeedback(true);
      setFeedbackEmoji('');
      setFeedbackComment('');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('❌ Failed to submit feedback. Please try again.', 'error');
  } finally {
    setSubmitting(false); // Reset submitting state
  }
};

// Add this notification function to your component
const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

// Add this state variable to your component
const [submitting, setSubmitting] = useState(false);

  const handleCloseFeedbackModal = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setIsFeedbackModalOpen(false);
  };

  // Add styles for the notification animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in-out {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
      
      .animate-fade-in-out {
        animation: fade-in-out 3s ease-in-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative flex flex-col">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80')] bg-cover bg-center opacity-10 animate-pulse-slow"></div>
      
      {/* Futuristic Circuit Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMSAxaDR2NEgxem00IDBoNHY0SDV6bTI0IDBo-NGg0djRoLTR6bTQgMGg0djRoLTR6bTEyIDBoNHY0aC00ek0xIDVoNHY0SDF6bTggMGg0djRIOXptOCAwaDR2NEgxN3ptMTIgMGg0djRoLTR6bTggMGg0djRoLTR6TTEgOWg0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em00IDBoNHY0aC00em0xMiAwaDR2NGgtNHptOCAwaDR2NGgtNHpNMSAxM2g0djRIMXptNCAwaDR2NEg1em0yNCAwaDR2NGgtNHptMTYgMGg0djRoLTR6TTEgMTdoNHY0SDV6TTEgMTdoNHY0SDV6bTI0IDBoNHY0aC00em0xNiAwaDR2NGgtNHpNMSAyMWg0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em0xMiAwaDR2NGgtNHptMTIgMGg0djRoLTR6TTEgMjVoNHY0SDV6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTExIDBoNHY0aC00ek0xIDI5aDR2NEgxem00IDBoNHY0SDV6bTggMGg0djRoLTR6bTEyIDBoNHY0aC00em0xMiAwaDR2NGgtNHpNMSAzM2g0djRIMXptOCAwaDR2NEg5em00IDBoNHY0aC00em00IDBoNHY0aC00em04IDBoNHY0aC00ek0xIDM3aDR2NEgxem04IDBoNHY0SDl6bTggMGg0djRoLTR6bTggMGg0djRoLTR6bTQgMGg0djRoLTR6TTEgNDFoNHY0SDF6bTQgMGg0djRINXptOCAwaDR2NGgtNHptNCAwaDR2NGgtNHptOCAwaDR2NGgtNHptMTIgMGg0djRoLTR6TTEgNDVoNHY0SDV6bTggMGg0djRIOXptMTIgMGg0djRoLTR6bTQgMGg0djRoLTR6bTggMGg0djRoLTR6Ij48L3BhdGg+PC9zdmc+')] opacity-5"></div>
      
      {/* Main Content */}
      <div className="relative flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <motion.h1 
          className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 text-center text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-gradient"
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

        {/* Futuristic Upload Section */}
        <motion.div 
          className="cyber-container mb-6 sm:mb-8 p-4 sm:p-8"
          variants={itemVariants}
        >
          <div className="matrix-bg">
            {createMatrixBackground()}
          </div>

          {/* Welcome Message */}
          <motion.div 
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="cyber-text text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">
              {userName ? `Welcome, ${userName}! 👋` : "Let's play 'Where Did All My Money Go? 🔍"}
            </h2>
            <p className="text-blue-300/80 text-base sm:text-lg">
              {userName 
                ? "Ready to decode your financial story? Let's make those numbers dance! 💫" 
                : "Let's turn those boring transactions into money insights that actually make sense 💫"}
            </p>
            <motion.p 
              className="text-blue-400/60 text-xs sm:text-sm mt-2"
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              No more spreadsheet nightmares, we promise! ✨
            </motion.p>
          </motion.div>

          {/* Upload Area */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="w-full">
              <label className="block w-full">
                <motion.div 
                  className="relative h-48 sm:h-64 rounded-xl border-2 border-blue-400/30 bg-black/30 backdrop-blur-xl cursor-pointer overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                    animate={{
                      background: [
                        'linear-gradient(45deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))',
                        'linear-gradient(225deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))',
                        'linear-gradient(45deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div className="relative h-full flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
                    {/* Upload Icon */}
                    <motion.div
                      className="flex items-center justify-center"
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <motion.path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="1.5" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          animate={{
                            pathLength: [0, 1],
                            opacity: [0.2, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </svg>
                    </motion.div>

                    {/* Upload Text Content */}
                    <div className="text-center space-y-2 sm:space-y-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-400">
                        Drop Your HDFC Statement Here
                      </h3>
                      <p className="text-sm sm:text-base text-blue-300/60">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs sm:text-sm text-blue-300/40">
                        We're best friends with Excel (.xls) files 🤝
                      </p>
                      <motion.div 
                        className="inline-block"
                        animate={{
                          scale: [1, 1.02, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <p className="text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-yellow-400/70 bg-yellow-400/10">
                          Psst! We're currently in an exclusive relationship with HDFC Bank Excel statements 💝
                        </p>
                      </motion.div>
                    </div>

                    {/* File Name Display */}
                    {fileName && (
                      <motion.div 
                        className="mt-3 sm:mt-4 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-xs sm:text-sm font-medium text-blue-400 truncate max-w-[90%] sm:max-w-md mx-auto">
                          Ready to decode: {fileName}
                        </p>
                        <p className="text-xs text-blue-300/40 mt-1">
                          Your financial story is about to get interesting! 📊
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xls,.xlsx,.csv,.pdf" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Analyze Button */}
            <motion.button 
              onClick={analyzeStatement}
              disabled={loading || !file}
              className={`cyber-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-white relative ${
                !file ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center justify-center text-base sm:text-lg">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Decoding Money Magic...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Reveal Insights ✨
                  </>
                )}
              </span>
            </motion.button>
          </div>

          {error && (
            <motion.div 
              className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-red-400">
                <span className="font-bold">Oops! </span>
                {error} 🤔
              </p>
            </motion.div>
          )}
        </motion.div>
        
        {/* Preview Features - Only show when no analysis results */}
        {!analysisResults && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center mb-8">
              <h2 className="cyber-text text-3xl font-bold mb-3">
                Here's What You'll Get 🎯
              </h2>
              <p className="text-blue-300/80">
                A sneak peek into your financial insights dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Smart Categorization */}
              <motion.div
                className="cyber-container p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-400">Smart Categorization</h3>
                </div>
                <p className="text-blue-300/60">
                  Automatically categorizes your transactions into meaningful groups like Shopping, Food, Travel, etc.
                </p>
              </motion.div>

              {/* Spending Insights */}
              <motion.div
                className="cyber-container p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-purple-400">Spending Insights</h3>
                </div>
                <p className="text-blue-300/60">
                  Visual breakdowns of your spending patterns with interactive charts and trends.
                </p>
              </motion.div>

              {/* Monthly Analysis */}
              <motion.div
                className="cyber-container p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-green-400">Monthly Analysis</h3>
                </div>
                <p className="text-blue-300/60">
                  Track your monthly income, expenses, and savings with detailed comparisons.
                </p>
              </motion.div>
            </div>

            {/* Interactive Demo Dashboard */}
            <motion.div
              className="mt-8 cyber-container p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sample Chart */}
                <div className="bg-black/30 rounded-lg p-6 border border-blue-400/20">
                  <h4 className="text-lg font-semibold text-blue-400 mb-4">Sample Spending Overview</h4>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full h-full relative">
                      {/* Animated placeholder chart */}
                      <div className="absolute inset-0 flex items-end justify-around">
                        {[40, 70, 55, 80, 65, 45, 75].map((height, index) => (
                          <motion.div
                            key={index}
                            className="w-8 bg-blue-400/20 rounded-t-lg"
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{
                              duration: 1,
                              delay: index * 0.1,
                              repeat: Infinity,
                              repeatType: "reverse",
                              repeatDelay: 2
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Stats */}
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-4 border border-purple-400/20">
                    <h4 className="text-sm text-purple-400">Top Spending Category</h4>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-semibold text-white">Shopping</p>
                      <motion.p 
                        className="text-xl font-bold text-purple-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ₹12,450
                      </motion.p>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border border-green-400/20">
                    <h4 className="text-sm text-green-400">Monthly Savings</h4>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-semibold text-white">Average</p>
                      <motion.p 
                        className="text-xl font-bold text-green-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        ₹25,800
                      </motion.p>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg p-4 border border-blue-400/20">
                    <h4 className="text-sm text-blue-400">Smart Insights</h4>
                    <motion.p 
                      className="text-sm text-blue-300/60 mt-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                      "Your dining expenses decreased by 15% compared to last month. Great job on the savings! 🎉"
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

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
  <nav className="grid grid-cols-3 sm:grid-cols-5 gap-2 -mb-px">
    {['summary', 'monthly', 'categories', 'patterns', 'insights'].map((tab) => (
      <motion.button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`py-2 px-2 sm:py-4 sm:px-6 text-center border-b-2 font-medium text-xs sm:text-sm transition-all duration-300 ${
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
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="flex flex-col mb-8">
                      <motion.h2 
                        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2" 
                        variants={itemVariants}
                      >
                        {userName ? `${userName}'s Financial Summary` : 'Financial Summary'}
                      </motion.h2>
                      <motion.p 
                        className="text-blue-300/80 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {userName 
                          ? `Ready to see where your money's been partying, ${userName.split(' ')[0]}? Let's break it down! 🎉` 
                          : "Let's decode your financial story! 🎉"}
                      </motion.p>
                      <motion.div 
                        className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-4"
                        variants={itemVariants}
                      />
                    </motion.div>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-12">
                      {[
                        { 
                          title: 'Total Income', 
                          value: analysisResults.totalIncome, 
                          color: 'blue',
                          icon: '💰',
                          trend: 'up'
                        },
                        { 
                          title: 'Total Expenses', 
                          value: analysisResults.totalExpenses, 
                          color: 'red',
                          icon: '💸',
                          trend: 'down'
                        },
                        { 
                          title: 'Net Savings', 
                          value: analysisResults.netSavings, 
                          color: analysisResults.netSavings >= 0 ? 'green' : 'red',
                          icon: analysisResults.netSavings >= 0 ? '📈' : '📉',
                          trend: analysisResults.netSavings >= 0 ? 'up' : 'down'
                        },
                        { 
                          title: 'Savings Rate', 
                          value: `${analysisResults.savingsRate.toFixed(2)}%`, 
                          color: analysisResults.savingsRate >= 0 ? 'purple' : 'red',
                          icon: '🎯',
                          trend: analysisResults.savingsRate >= 20 ? 'up' : 'down'
                        },
                        { 
                          title: 'Total Investments', 
                          value: analysisResults.totalInvestments, 
                          color: 'indigo',
                          icon: '💎',
                          trend: 'up'
                        }
                      ].map((card, index) => (
                        <motion.div
                          key={index}
                          className={`relative group bg-gradient-to-br from-${card.color}-500/10 to-${card.color}-600/5 p-4 sm:p-6 rounded-xl shadow-lg border border-${card.color}-400/20 hover:border-${card.color}-400/40 transition-all duration-300 overflow-hidden`}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* Animated background gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br from-${card.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          {/* Glowing border effect */}
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-${card.color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <h3 className={`text-base sm:text-lg font-semibold text-${card.color}-200`}>{card.title}</h3>
                              <span className="text-xl sm:text-2xl">{card.icon}</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                              {typeof card.value === 'number' ? formatCurrency(card.value) : card.value}
                            </p>
                            <div className={`flex items-center text-xs sm:text-sm ${card.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                              <span className="mr-1">{card.trend === 'up' ? '↑' : '↓'}</span>
                              {card.trend === 'up' ? 'Positive' : 'Negative'} Trend
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Quick Stats Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <motion.div 
                        className="bg-white/5 p-6 rounded-xl border border-white/10"
                        variants={itemVariants}
                      >
                        <h4 className="text-lg font-semibold text-white/80 mb-2">
                          {userName 
                            ? `${userName.split(' ')[0]}'s Monthly Rhythm` 
                            : 'Monthly Average'}
                        </h4>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(
                            analysisResults.monthlyAnalysis && analysisResults.monthlyAnalysis.length > 0
                              ? analysisResults.monthlyAnalysis.reduce((sum, month) => sum + month.expenses, 0) / 
                                analysisResults.monthlyAnalysis.length
                              : analysisResults.totalExpenses / 12
                          )}
                        </p>
                        <p className="text-sm text-white/60">
                          Average monthly spending over {analysisResults.monthlyAnalysis?.length || 12} months
                        </p>
                        {analysisResults.monthlyAnalysis && analysisResults.monthlyAnalysis.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="text-green-400">
                              Lowest: {formatCurrency(Math.min(...analysisResults.monthlyAnalysis.map(m => m.expenses)))}
                            </p>
                            <p className="text-red-400">
                              Highest: {formatCurrency(Math.max(...analysisResults.monthlyAnalysis.map(m => m.expenses)))}
                            </p>
                          </div>
                        )}
                      </motion.div>
                      
                      <motion.div 
                        className="bg-white/5 p-6 rounded-xl border border-white/10"
                        variants={itemVariants}
                      >
                        <h4 className="text-lg font-semibold text-white/80 mb-2">Investment Ratio</h4>
                        <p className="text-2xl font-bold text-white">
                          {((analysisResults.totalInvestments / analysisResults.totalIncome) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-white/60">Of Total Income</p>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-white/5 p-6 rounded-xl border border-white/10"
                        variants={itemVariants}
                      >
                        <h4 className="text-lg font-semibold text-white/80 mb-2">Expense Ratio</h4>
                        <p className="text-2xl font-bold text-white">
                          {((analysisResults.totalExpenses / analysisResults.totalIncome) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-white/60">Of Total Income</p>
                      </motion.div>
                    </div>
                    
                    {/* Top Income Sources */}
                    <div className="mb-8">
                      <motion.div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Top Income Sources</h3>
                        <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-green-300 rounded-full" />
                      </motion.div>
                      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Date</th>
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Description</th>
                              <th className="py-4 px-6 text-right text-sm font-medium text-gray-300">Amount</th>
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.topIncome.map((income, index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 text-sm text-gray-300">{income.date}</td>
                                <td className="py-4 px-6 text-sm text-gray-300">{income.description}</td>
                                <td className="py-4 px-6 text-sm text-right font-medium text-green-400">
                                  {formatCurrency(income.credit)}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(income.category)} />
                                    </svg>
                                    <span className="text-sm text-gray-300">{income.category}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Top Expenses */}
                    <div className="mb-8">
                      <motion.div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Top Expenses</h3>
                        <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-red-300 rounded-full" />
                      </motion.div>
                      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Date</th>
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Description</th>
                              <th className="py-4 px-6 text-right text-sm font-medium text-gray-300">Amount</th>
                              <th className="py-4 px-6 text-left text-sm font-medium text-gray-300">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResults.topExpenses.map((expense, index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 text-sm text-gray-300">{expense.date}</td>
                                <td className="py-4 px-6 text-sm text-gray-300">{expense.description}</td>
                                <td className="py-4 px-6 text-sm text-right font-medium text-red-400">
                                  {formatCurrency(expense.debit)}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(expense.category)} />
                                    </svg>
                                    <span className="text-sm text-gray-300">{expense.category}</span>
                                  </div>
                                </td>
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
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="flex flex-col mb-8">
                      <motion.h2 
                        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2" 
                        variants={itemVariants}
                      >
                        {userName 
                          ? `${userName}'s Monthly Journey` 
                          : 'Monthly Analysis'}
                      </motion.h2>
                      <motion.p 
                        className="text-blue-300/80 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {userName 
                          ? `Let's see how your money moves month by month, ${userName.split(' ')[0]}! 📅` 
                          : "Track your financial journey through time! 📅"}
                      </motion.p>
                      <motion.div 
                        className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-4"
                        variants={itemVariants}
                      />
                    </motion.div>
                    
                    {/* Monthly Overview Cards */}
                    {analysisResults.monthlyAnalysis && analysisResults.monthlyAnalysis.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                          {/* Average Monthly Income */}
                          <motion.div
                            className="relative group bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 sm:p-6 rounded-xl shadow-lg border border-green-400/20 hover:border-green-400/40 transition-all duration-300"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-green-200">Avg Monthly Income</h3>
                                <span className="text-xl sm:text-2xl">💰</span>
                              </div>
                              <p className="text-2xl font-bold text-white mb-2">
                                {formatCurrency(analysisResults.monthlyAnalysis.reduce((sum, month) => sum + month.income, 0) / analysisResults.monthlyAnalysis.length)}
                              </p>
                              <p className="text-sm text-green-300/60">Over {analysisResults.monthlyAnalysis.length} months</p>
                            </div>
                          </motion.div>

                          {/* Average Monthly Expenses */}
                          <motion.div
                            className="relative group bg-gradient-to-br from-red-500/10 to-red-600/5 p-4 sm:p-6 rounded-xl shadow-lg border border-red-400/20 hover:border-red-400/40 transition-all duration-300"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-red-200">Avg Monthly Expenses</h3>
                                <span className="text-xl sm:text-2xl">💸</span>
                              </div>
                              <p className="text-2xl font-bold text-white mb-2">
                                {formatCurrency(analysisResults.monthlyAnalysis.reduce((sum, month) => sum + month.expenses, 0) / analysisResults.monthlyAnalysis.length)}
                              </p>
                              <p className="text-sm text-red-300/60">Monthly average spending</p>
                            </div>
                          </motion.div>

                          {/* Average Monthly Savings */}
                          <motion.div
                            className="relative group bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 sm:p-6 rounded-xl shadow-lg border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-blue-200">Avg Monthly Savings</h3>
                                <span className="text-xl sm:text-2xl">🎯</span>
                              </div>
                              <p className="text-2xl font-bold text-white mb-2">
                                {formatCurrency(analysisResults.monthlyAnalysis.reduce((sum, month) => sum + month.savings, 0) / analysisResults.monthlyAnalysis.length)}
                              </p>
                              <p className="text-sm text-blue-300/60">Average money saved</p>
                            </div>
                          </motion.div>

                          {/* Average Savings Rate */}
                          <motion.div
                            className="relative group bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 sm:p-6 rounded-xl shadow-lg border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base sm:text-lg font-semibold text-purple-200">Avg Savings Rate</h3>
                                <span className="text-xl sm:text-2xl">📊</span>
                              </div>
                              <p className="text-2xl font-bold text-white mb-2">
                                {(analysisResults.monthlyAnalysis.reduce((sum, month) => sum + month.savingsRate, 0) / analysisResults.monthlyAnalysis.length).toFixed(1)}%
                              </p>
                              <p className="text-sm text-purple-300/60">Of monthly income</p>
                            </div>
                          </motion.div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                          {/* Monthly Income vs Expenses Chart */}
                          <motion.div 
                            className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm"
                            variants={itemVariants}
                          >
                            <h3 className="text-xl font-semibold mb-6 text-white">Income vs Expenses Trend</h3>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={analysisResults.monthlyAnalysis}
                                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                  <XAxis 
                                    dataKey="month" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={60}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    stroke="rgba(255,255,255,0.1)"
                                  />
                                  <YAxis 
                                    tickFormatter={(value) => formatCurrency(value).replace('₹', '')}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    stroke="rgba(255,255,255,0.1)"
                                  />
                                  <Tooltip 
                                    contentStyle={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value) => [formatCurrency(value), '']}
                                  />
                                  <Legend />
                                  <Bar dataKey="income" name="Income" fill="#10B981" />
                                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </motion.div>

                          {/* Monthly Savings Trend Chart */}
                          <motion.div 
                            className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm"
                            variants={itemVariants}
                          >
                            <h3 className="text-xl font-semibold mb-6 text-white">Savings Journey</h3>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={analysisResults.monthlyAnalysis}
                                  margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                  <XAxis 
                                    dataKey="month" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={60}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    stroke="rgba(255,255,255,0.1)"
                                  />
                                  <YAxis 
                                    tickFormatter={(value) => formatCurrency(value).replace('₹', '')}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    stroke="rgba(255,255,255,0.1)"
                                  />
                                  <Tooltip 
                                    contentStyle={{
                                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}
                                    formatter={(value) => [formatCurrency(value), '']}
                                  />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="savings" 
                                    name="Savings" 
                                    stroke="#8B5CF6" 
                                    strokeWidth={2}
                                    dot={{ fill: '#8B5CF6', r: 4 }}
                                    activeDot={{ r: 8 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </motion.div>
                        </div>

                        {/* Monthly Details Table */}
                        <motion.div 
                          className="bg-white/5 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm"
                          variants={itemVariants}
                        >
                          <div className="p-6 border-b border-white/10">
                            <h3 className="text-xl font-semibold text-white">Monthly Breakdown</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead>
                                <tr className="bg-white/5">
                                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Month</th>
                                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Income</th>
                                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Expenses</th>
                                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Savings</th>
                                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Savings Rate</th>
                                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Transactions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700 bg-white/5">
                                {analysisResults.monthlyAnalysis.map((month, index) => (
                                  <tr key={index} className="hover:bg-white/10 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{month.month}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">{formatCurrency(month.income)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">{formatCurrency(month.expenses)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${month.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {formatCurrency(month.savings)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${month.savingsRate >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {month.savingsRate.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-400">{month.transactions}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div 
                        className="text-center p-8 bg-white/5 rounded-lg"
                        variants={itemVariants}
                      >
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Monthly Data Available</h3>
                        <p className="text-gray-400">Please ensure your statement contains valid transaction dates.</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
                {/* Categories Tab */}
                {activeTab === 'categories' && (
                  <motion.div 
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="flex items-center justify-between mb-8">
                      <motion.h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" variants={itemVariants}>
                        Categories Analysis
                      </motion.h2>
                      <motion.div 
                        className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        variants={itemVariants}
                      />
                    </motion.div>
                    
                    {/* Categories Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      <motion.div 
                        className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 rounded-xl border border-blue-400/20"
                        variants={itemVariants}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-blue-200">Total Categories</h3>
                          <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {analysisResults.categorySpendingArray.length + analysisResults.categoryIncomeArray.length}
                        </p>
                        <p className="text-sm text-blue-300/60 mt-2">
                          Unique spending and income categories
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 rounded-xl border border-purple-400/20"
                        variants={itemVariants}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-purple-200">Top Category</h3>
                          <span className="text-2xl">🏆</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                          {analysisResults.categorySpendingArray[0]?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-purple-300/60 mt-2">
                          {formatCurrency(analysisResults.categorySpendingArray[0]?.value || 0)}
                        </p>
                      </motion.div>
                    </div>
                    
                    {/* Categories Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                      {/* Expense Categories */}
                      <motion.div 
                        className="bg-white/5 p-6 rounded-xl border border-white/10"
                        variants={itemVariants}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-white">Expense Categories</h3>
                          <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-red-300 rounded-full" />
                        </div>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={analysisResults.categorySpendingArray.slice(0, 7)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                labelStyle={{ 
                                  fontSize: '14px',
                                  fill: '#fff',
                                  fontWeight: 'bold',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}
                              >
                                {analysisResults.categorySpendingArray.slice(0, 7).map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="#fff"
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  backdropFilter: 'blur(8px)',
                                  color: '#fff',
                                  padding: '12px',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                                labelStyle={{ 
                                  color: '#fff', 
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  marginBottom: '4px'
                                }}
                                itemStyle={{
                                  color: '#fff',
                                  fontSize: '13px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                      
                      {/* Income Categories */}
                      <motion.div 
                        className="bg-white/5 p-6 rounded-xl border border-white/10"
                        variants={itemVariants}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-white">Income Categories</h3>
                          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-green-300 rounded-full" />
                        </div>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={analysisResults.categoryIncomeArray.slice(0, 7)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                labelStyle={{ 
                                  fontSize: '14px',
                                  fill: '#fff',
                                  fontWeight: 'bold',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}
                              >
                                {analysisResults.categoryIncomeArray.slice(0, 7).map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="#fff"
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  backdropFilter: 'blur(8px)',
                                  color: '#fff',
                                  padding: '12px',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                                labelStyle={{ 
                                  color: '#fff', 
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  marginBottom: '4px'
                                }}
                                itemStyle={{
                                  color: '#fff',
                                  fontSize: '13px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Categories Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Expense Categories Table */}
                      <motion.div 
                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                        variants={itemVariants}
                      >
                        <div className="p-6 border-b border-white/10">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">Expense Categories Detail</h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-red-300 rounded-full" />
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Percentage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {analysisResults.categorySpendingArray.map((category, index) => (
                                <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <svg className="h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(category.name)} />
                                      </svg>
                                      <span className="text-sm text-gray-300">{category.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                    ₹{category.value.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                    {((category.value / analysisResults.totalExpenses) * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                      
                      {/* Income Categories Table */}
                      <motion.div 
                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                        variants={itemVariants}
                      >
                        <div className="p-6 border-b border-white/10">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">Income Categories Detail</h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-green-300 rounded-full" />
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Percentage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {analysisResults.categoryIncomeArray.map((category, index) => (
                                <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <svg className="h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getCategoryIcon(category.name)} />
                                      </svg>
                                      <span className="text-sm text-gray-300">{category.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                    ₹{category.value.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                                    {((category.value / analysisResults.totalIncome) * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
                
                {/* Spending Patterns Tab */}
                {activeTab === 'patterns' && (
                  <motion.div 
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="flex flex-col mb-8">
                      <motion.h2 
                        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2" 
                        variants={itemVariants}
                      >
                        {userName 
                          ? `${userName}'s Spending Rhythms 🎵` 
                          : 'Spending Patterns'}
                      </motion.h2>
                      <motion.p 
                        className="text-blue-300/80 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {userName 
                          ? `Let's see when and how your money likes to dance, ${userName.split(' ')[0]}! 💃` 
                          : "Discover the rhythm of your spending habits! 💫"}
                      </motion.p>
                      <motion.div 
                        className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-4"
                        variants={itemVariants}
                      />
                    </motion.div>

                    {/* Pattern Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {/* Highest Spending Day */}
                      <motion.div
                        className="relative group bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 rounded-xl shadow-lg border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-blue-200">Peak Spending Day</h3>
                            <span className="text-2xl">📅</span>
                          </div>
                          <p className="text-2xl font-bold text-white mb-2">
                            {analysisResults.dayOfWeekArray.reduce((max, day) => 
                              day.value > max.value ? day : max
                            ).name}
                          </p>
                          <p className="text-sm text-blue-300/60">
                            Average spend: {formatCurrency(analysisResults.dayOfWeekArray.reduce((max, day) => 
                              day.value > max.value ? day : max
                            ).value)}
                          </p>
                        </div>
                      </motion.div>

                      {/* Most Common Transaction */}
                      <motion.div
                        className="relative group bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 rounded-xl shadow-lg border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-purple-200">Most Frequent</h3>
                            <span className="text-2xl">🔄</span>
                          </div>
                          <p className="text-xl font-bold text-white mb-2">
                            {analysisResults.potentialRecurring[0]?.description.slice(0, 20)}...
                          </p>
                          <p className="text-sm text-purple-300/60">
                            {analysisResults.potentialRecurring[0]?.occurrences} times
                          </p>
                        </div>
                      </motion.div>

                      {/* Largest Recurring Payment */}
                      <motion.div
                        className="relative group bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 rounded-xl shadow-lg border border-green-400/20 hover:border-green-400/40 transition-all duration-300"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-green-200">Largest Recurring</h3>
                            <span className="text-2xl">💸</span>
                          </div>
                          <p className="text-2xl font-bold text-white mb-2">
                            {formatCurrency(Math.max(...analysisResults.potentialRecurring.map(t => 
                              t.type === 'expense' ? t.avgDebit : t.avgCredit
                            )))}
                          </p>
                          <p className="text-sm text-green-300/60">Monthly average</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Day of Week Analysis */}
                    <motion.div 
                      className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8"
                      variants={itemVariants}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Weekly Spending Rhythm</h3>
                        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full" />
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analysisResults.dayOfWeekArray}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: '#9CA3AF', fontSize: 12 }}
                              stroke="rgba(255,255,255,0.1)"
                            />
                            <YAxis 
                              tick={{ fill: '#9CA3AF', fontSize: 12 }}
                              stroke="rgba(255,255,255,0.1)"
                              tickFormatter={(value) => formatCurrency(value).replace('₹', '')}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                color: '#ffffff'
                              }}
                              formatter={(value) => [formatCurrency(value), 'Spending']}
                              labelStyle={{
                                color: '#ffffff'
                              }}
                              itemStyle={{
                                color: '#ffffff'
                              }}
                            />
                            <Bar 
                              dataKey="value" 
                              name="Amount"
                              fill="url(#barGradient)"
                            >
                              {analysisResults.dayOfWeekArray.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`}
                                  fill={`url(#barGradient-${index})`}
                                />
                              ))}
                            </Bar>
                            <defs>
                              {analysisResults.dayOfWeekArray.map((entry, index) => (
                                <linearGradient
                                  key={`barGradient-${index}`}
                                  id={`barGradient-${index}`}
                                  x1="0" y1="0" x2="0" y2="1"
                                >
                                  <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                                  <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3}/>
                                </linearGradient>
                              ))}
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* Recurring Transactions */}
                    <motion.div 
                      className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white">Recurring Transactions</h3>
                          <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full" />
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead>
                            <tr className="bg-white/5">
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Frequency</th>
                              <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Average Amount</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {analysisResults.potentialRecurring.map((transaction, index) => (
                              <motion.tr 
                                key={index}
                                className="hover:bg-white/5 transition-colors"
                                variants={itemVariants}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <span className="text-lg mr-3">
                                      {transaction.type === 'expense' ? '💸' : '💰'}
                                    </span>
                                    <span className="text-sm text-gray-300">{transaction.description}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
                                    {transaction.occurrences}x
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">
                                  <span className={transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'}>
                                    {formatCurrency(transaction.type === 'expense' ? transaction.avgDebit : transaction.avgCredit)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      transaction.type === 'expense' 
                                        ? 'bg-red-500/20 text-red-400' 
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                    </span>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
                
                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <motion.div 
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="flex flex-col mb-8">
                      <motion.h2 
                        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2" 
                        variants={itemVariants}
                      >
                        {userName 
                          ? `${userName.split(' ')[0]}'s Money Mysteries Revealed! 🔍` 
                          : 'Financial Insights'}
                      </motion.h2>
                      <motion.p 
                        className="text-blue-300/80 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {userName 
                          ? `Alright ${userName.split(' ')[0]}, we've done some financial detective work. Here's what we found! 🕵️‍♂️` 
                          : "We've analyzed your transactions and found some interesting patterns!"}
                      </motion.p>
                    </motion.div>
                    
                    <div className="space-y-6">
                      {analysisResults.insights.map((insight, index) => (
                        <motion.div 
                          key={index} 
                          className={`p-6 rounded-xl shadow-lg backdrop-blur-sm border-l-4 ${
                            insight.type === 'positive' ? 'bg-green-500/10 border-green-500 text-white' :
                            insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500 text-white' :
                            insight.type === 'info' ? 'bg-blue-500/10 border-blue-500 text-white' :
                            'bg-purple-500/10 border-purple-500 text-white'
                          }`}
                          variants={itemVariants}
                        >
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {insight.type === 'positive' && (
                                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {insight.type === 'warning' && (
                                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              {insight.type === 'info' && (
                                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {insight.type === 'suggestion' && (
                                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <p className="text-base">{insight.text}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Additional recommendations */}
                      <div className="mt-8">
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6">Recommendations</h3>
                        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                          <h4 className="text-xl font-semibold text-white mb-4">Based on your financial data, here are some recommendations:</h4>
                          <ul className="space-y-4 text-white/90">
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">💰</span>
                              Follow the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings or debt repayment.
                            </li>
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">🏦</span>
                              Build an emergency fund to cover 3-6 months of expenses.
                            </li>
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">📊</span>
                              Review your recurring expenses and subscriptions to identify potential areas to cut back.
                            </li>
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">⚡</span>
                              Consider automating savings to ensure you consistently set money aside.
                            </li>
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">📱</span>
                              Track your expenses regularly to stay aware of your spending patterns.
                            </li>
                            <li className="flex items-center">
                              <span className="mr-3 text-xl">🎯</span>
                              Plan for large expenses by creating specific savings goals.
                            </li>
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
      </div>

      {/* Footer */}
      <footer className="relative mt-auto border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <div className="text-white/60 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} Pixel Wealth. All rights reserved.
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors duration-200 flex items-center gap-1.5 sm:gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
                Privacy & Terms
              </button>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors duration-200 flex items-center gap-1.5 sm:gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Privacy & Terms</h2>
                  <button
                    onClick={() => setIsPrivacyModalOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>


<div className="p-4 sm:p-6 space-y-4 text-sm sm:text-base text-white/70">
  <section>
    <h3 className="text-white font-semibold mb-2">Data Privacy</h3>
    <p>Your financial data is processed entirely in your browser. We don't store or transmit any of your information to external servers.</p>
  </section>
  
  <section>
    <h3 className="text-white font-semibold mb-2">Security</h3>
    <p>All analysis is performed locally on your device. Your bank statements remain private and are never uploaded to any server.</p>
  </section>
  
  <section>
    <h3 className="text-white font-semibold mb-2">How It Works</h3>
    <p>We use client-side JavaScript to analyze your financial data, which means:</p>
    <ul className="list-disc pl-5 mt-2 space-y-1">
      <li>Your data never leaves your device</li>
      <li>Nothing is stored on our servers</li>
      <li>No one else can see your financial information</li>
      <li>Refresh the page and all data is gone</li>
    </ul>
  </section>
  <section className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
  <h3 className="text-yellow-400 font-semibold mb-2">Disclaimer</h3>
  <p className="text-white/70">
    This app is currently in beta. While we do our best to provide accurate analysis, there may be rough edges and occasional inaccuracies in how your data is processed and displayed.
  </p>
  <ul className="list-disc pl-5 mt-2 space-y-1 text-white/70">
    <li>Transaction categorization may not always be 100% accurate</li>
    <li>Complex date formats in some bank statements may be interpreted incorrectly</li>
    <li>Certain special characters or formatting in PDFs might cause parsing issues</li>
    <li>Visual representations and calculated totals should be verified against your actual statements</li>
  </ul>
  <p className="text-white/70 mt-2">
    Please review all information carefully and use the insights as guidance rather than definitive financial information. We're continuously improving the app to enhance accuracy and performance.
  </p>
</section>
 
  <section>
    <h3 className="text-white font-semibold mb-2">Cookies & Local Storage</h3>
    <p>We use localStorage to remember your UI preferences, such as whether you've dismissed the privacy notice. No financial data is stored in cookies or localStorage.</p>
  </section>
  
  <section>
    <h3 className="text-white font-semibold mb-2">Usage Terms</h3>
    <p>This tool is provided for personal financial analysis. The insights generated are based on the data you provide and should not be considered as financial advice.</p>
  </section>
  
  <section>
    <h3 className="text-white font-semibold mb-2">Your Rights</h3>
    <p>Since we don't collect or store your personal data, there's nothing for us to delete, correct, or export. You have complete control over your data at all times.</p>
  </section>
</div>
              <div className="p-4 sm:p-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
 {/* Replace your existing Contact Modal with this one */}
<AnimatePresence>
  {isContactModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-lg shadow-xl max-w-lg w-full"
      >
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Contact Us</h2>
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <form 
            name="contact" 
            method="POST" 
            data-netlify="true" 
            data-netlify-honeypot="bot-field" 
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Get form data
              const formData = new FormData(e.target);
              
              // Create request body
              const body = new URLSearchParams();
              body.append('form-name', 'contact');
              
              // Add all form fields to body
              for (const pair of formData.entries()) {
                body.append(pair[0], pair[1]);
              }
              
              // Submit the form
              fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
              })
                .then(() => {
                  // Show success message
                  showNotification('✨ Message sent successfully!', 'success');
                  // Close the modal
                  setIsContactModalOpen(false);
                  // Reset the form by clearing all inputs
                  e.target.reset();
                })
                .catch(error => {
                  console.error('Error submitting form:', error);
                  showNotification('❌ Failed to send message. Please try again.', 'error');
                });
            }}
          >
            <input type="hidden" name="form-name" value="contact" />
            <p className="hidden">
              <label>
                Don't fill this out if you're human: <input name="bot-field" />
              </label>
            </p>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/30"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/30"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1">Message</label>
              <textarea
                name="message"
                id="message"
                required
                rows="4"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/30"
                placeholder="Your message..."
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Send Message
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Add Feedback Modal */}
{/* Replace your existing Feedback Modal with this one */}
<AnimatePresence>
  {isFeedbackModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-white/20"
      >
        <form 
          name="feedback" 
          method="POST" 
          data-netlify="true" 
          data-netlify-honeypot="bot-field"
          onSubmit={handleFeedbackSubmit}
          className="p-6 text-center"
        >
          {/* These hidden inputs are required for Netlify forms */}
          <input type="hidden" name="form-name" value="feedback" />
          <input type="hidden" name="bot-field" className="hidden" />
          
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl mb-4"
          >
            🎭
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">
            How's Your Financial Journey Going? 
          </h3>
          <p className="text-white/70 mb-6">
            Quick question! Did our analysis make your bank statement less boring? 🤔
          </p>

          {/* Emoji Selection */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {['😍', '😊', '😐', '😕', '😢'].map((emoji) => (
              <motion.button
                key={emoji}
                type="button" // Important - this makes it not submit the form
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setFeedbackEmoji(emoji)}
                className={`text-3xl p-2 rounded-lg transition-all ${
                  feedbackEmoji === emoji 
                    ? 'bg-white/20 shadow-lg scale-110' 
                    : 'hover:bg-white/10'
                }`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
          
          {/* Hidden input to store the selected emoji */}
          <input 
            type="hidden" 
            name="emoji" 
            value={feedbackEmoji} 
          />

          {/* Comment Input */}
          <div className="mb-6">
            <textarea
              name="comment"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Any thoughts to share? Don't be shy! 💭"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!feedbackEmoji || submitting}
              className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 ${
                feedbackEmoji && !submitting
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-pointer' 
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <span>Share Feedback</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </motion.button>
            <motion.button
              type="button" // Important - this makes it not submit the form
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCloseFeedbackModal}
              className="px-6 py-2 rounded-xl font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Maybe Later
            </motion.button>
          </div>
        </form>

        {/* Fun decorative elements */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1,
          }}
        />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
<PrivacyNotice />

    </div>
  );
};

export default BankStatementAnalyzer;