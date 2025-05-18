/**
 * Utility functions for formatting dates and times
 */

/**
 * Format a date to a human-readable format (DD.MM.YYYY)
 * @param date - The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return ''; 
  }
};

/**
 * Format a time to a human-readable format (HH:MM)
 * @param date - The date object containing the time to format
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Format a date and time together (DD.MM.YYYY HH:MM)
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  if (!date) return '';
  
  try {
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return '';
  }
};

/**
 * Calculate the difference between two dates in minutes
 * @param start - Start date
 * @param end - End date
 * @returns Difference in minutes
 */
export const getMinutesBetween = (start: Date, end: Date): number => {
  if (!start || !end) return 0;
  
  try {
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60));
  } catch (error) {
    console.error('Error calculating minutes between dates:', error);
    return 0;
  }
};

/**
 * Format a duration in minutes to hours and minutes (Xh Ym)
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes < 0) return '0d';
  
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}s ${mins}d`;
    } else if (hours > 0) {
      return `${hours}s`;
    } else {
      return `${mins}d`;
    }
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0d';
  }
}; 