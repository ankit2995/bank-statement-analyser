
// src/components/AnalyticsRouteTracker.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

function AnalyticsRouteTracker() {
  const location = useLocation();
  
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
  
  return null;
}

export default AnalyticsRouteTracker;