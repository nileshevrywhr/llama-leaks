/**
 * Calculate the time elapsed since a given timestamp and return it in the largest appropriate unit
 * with proper singular/plural forms
 */
export function calculateTimeSince(timestamp: string): string {
  try {
    const past = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    
    // If the timestamp is in the future, return "just now"
    if (diffMs < 0) {
      return "just now";
    }
    
    // Convert to different units
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30.44); // Average month length
    const years = Math.floor(days / 365.25); // Account for leap years
    
    // Return the largest applicable unit with proper singular/plural form
    if (years > 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (seconds > 0) {
      return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else {
      return "just now";
    }
  } catch (error) {
    console.error('Error calculating time since:', error);
    return "unknown";
  }
}

/**
 * Calculate time since with "ago" suffix for display
 */
export function calculateTimeSinceWithAgo(timestamp: string): string {
  const timeSince = calculateTimeSince(timestamp);
  if (timeSince === "just now" || timeSince === "unknown") {
    return timeSince;
  }
  return `${timeSince} ago`;
}