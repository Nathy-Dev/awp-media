/**
 * Contact details and outbound links.
 *
 * These were copy-pasted across nine pages in the old build, so a changed phone
 * number meant nine edits. Centralised here instead.
 */

export const SOCIALS = {
  facebook: "https://www.facebook.com/AOPworldwide",
  instagram: "https://www.instagram.com/apostlesofprayer?igsh=ZTUxcXczc3g2cXE2",
  youtube: "https://youtube.com/@awpworldwide?si=1mHSeUqdlw1r80AD",
  telegram: "https://t.me/awponline",
} as const;

export const CONTACT_EMAIL = "awpw.media@gmail.com";

export interface PhoneNumber {
  /** As displayed. */
  label: string;
  /** E.164 for the tel: href — the old markup had spaces in these. */
  href: string;
}

export const PHONES: readonly PhoneNumber[] = [
  { label: "0813 506 1115", href: "+2348135061115" },
  { label: "0818 172 3009", href: "+2348181723009" },
  { label: "0902 840 2356", href: "+2349028402356" },
  { label: "0813 003 8201", href: "+2348130038201" },
];

export const ADDRESS = "Pipeline, Rumuokwurusi, Portharcourt, Nigeria";

export const TAGLINE = "The Word & Prayer is our lifestyle...";
export const ORG_NAME = "APOSTLES OF THE WORD AND PRAYER WORLDWIDE";

/** Live service times, shown on /live and in the footer. */
export const LIVE_TIMES = "Live every Sunday at 9:00 AM WAT & Thursday at 5:30 PM WAT";
