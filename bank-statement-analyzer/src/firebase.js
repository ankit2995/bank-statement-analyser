// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and get a reference to the service
let analytics = null;

// Initialize analytics only in browser environment and non-development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  analytics = getAnalytics(app);
}

// Helper function to safely log events
export const trackEvent = (eventName, eventParams = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  } else {
    console.log('Analytics event tracked in development:', eventName, eventParams);
  }
};

export { app, analytics };