import { useState, useEffect } from 'react';

export const useTimeSince = (lastUpdated: Date | null) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated) {
        const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
        setTimeSinceUpdate(seconds);
      } else {
        setTimeSinceUpdate(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  return timeSinceUpdate;
};
