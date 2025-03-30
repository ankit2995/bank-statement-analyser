// src/hooks/useFirebaseAnalytics.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, trackEvent } from '../firebase';
import { logEvent } from 'firebase/analytics';

const useFirebaseAnalytics = () => {
  const location = useLocation();
  
  // Track page views when location changes
  useEffect(() => {
    if (analytics) {
      // Log page_view event
      logEvent(analytics, 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  }, [location]);

  return { trackEvent };
};

export default useFirebaseAnalytics;