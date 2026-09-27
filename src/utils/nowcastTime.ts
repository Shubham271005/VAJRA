/**
 * Dynamic Nowcast Time Utilities
 * Computes live current observation time and projected lead-hour forecast windows.
 */

export function formatLiveClock(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return `${day} ${month} ${year} • ${time} IST`;
}

export function formatObservationBase(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} ${year} • ${time} IST`;
}

export interface NowcastTargetTime {
  targetDate: Date;
  timeStr: string;            // e.g. "15:05 IST"
  clockOnly: string;          // e.g. "15:05"
  relativeLabel: string;      // e.g. "NOW (Live Baseline)" or "+3 HR LEAD"
  shortLead: string;          // e.g. "NOW" or "+3h"
  validityHeadline: string;   // e.g. "Valid for 15:05 IST (+3h Lead Horizon)"
  baseObservationStr: string; // e.g. "12:05 IST"
}

export function getLeadTargetTime(baseDate: Date, leadHours: number): NowcastTargetTime {
  const target = new Date(baseDate.getTime() + leadHours * 3600 * 1000);
  const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
  const clockOnly = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const baseClock = baseDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
  
  return {
    targetDate: target,
    timeStr,
    clockOnly,
    relativeLabel: leadHours === 0 ? 'NOW (Live Baseline)' : `+${leadHours} HR LEAD`,
    shortLead: leadHours === 0 ? 'NOW' : `+${leadHours}h`,
    validityHeadline: leadHours === 0 
      ? `LIVE OBSERVATION BASELINE (${timeStr})`
      : `VALID FOR ${timeStr} (+${leadHours} HR LEAD)`,
    baseObservationStr: baseClock
  };
}
