/**
 * Date utility functions with Tashkent timezone (UTC+5)
 */

export class DateUtil {
  private static readonly TASHKENT_OFFSET = 5 * 60 * 60 * 1000; // +5 hours in milliseconds

  /**
   * Get current date/time in Tashkent timezone
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Format date to ISO string with Tashkent timezone
   */
  static toISOString(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Format date to readable string in Tashkent timezone
   * Example: "2025-10-15 15:30:00"
   */
  static toReadableString(date: Date = new Date()): string {
    return date
      .toLocaleString('en-GB', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(',', '');
  }

  /**
   * Get date only (without time) in Tashkent timezone
   * Example: "2025-10-15"
   */
  static toDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Tashkent',
    });
  }

  /**
   * Get time only in Tashkent timezone
   * Example: "15:30:00"
   */
  static toTimeString(date: Date = new Date()): string {
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Tashkent',
      hour12: false,
    });
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add hours to a date
   */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Check if date is expired
   */
  static isExpired(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Get difference in days between two dates
   */
  static diffInDays(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get difference in hours between two dates
   */
  static diffInHours(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diff / (1000 * 60 * 60));
  }
}



