import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useTimers = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const setupBoundaryTimer = () => {
      const now = new Date();
      // Get current IST time components
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istNow = new Date(istString);
      
      const hours = istNow.getHours();
      const minutes = istNow.getMinutes();
      const seconds = istNow.getSeconds();
      const ms = istNow.getMilliseconds();
      
      let targetHours = 0;
      if (hours >= 0 && hours < 7) {
        targetHours = 7; // Next boundary is 7:00 AM
      } else {
        targetHours = 24; // Next boundary is Midnight
      }

      // Calculate exact milliseconds until the next boundary
      const currentMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
      const targetMs = targetHours * 3600000;
      const msUntilBoundary = targetMs - currentMs;
      
      // Add a 1-second buffer to guarantee the clock has ticked over
      const timeoutId = setTimeout(() => {
        window.location.reload();
      }, msUntilBoundary + 1000);

      return timeoutId;
    };

    const timeoutId = setupBoundaryTimer();
    return () => clearTimeout(timeoutId);
  }, [queryClient]);
};
