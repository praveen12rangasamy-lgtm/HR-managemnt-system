
/**
 * Resend Email Utility
 * 
 * Note: Resend's API strictly forbids browser-side requests due to security (API key exposure)
 * and CORS policy. This utility is designed for server-side use or development testing only.
 * 
 * In a production environment, you should move this logic to a Supabase Edge Function
 * or a server-side route.
 */

import { supabase } from './supabase';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, from },
    });

    if (error) {
      console.error('Edge Function Error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Network Error while sending email:', error);
    return { success: false, error: 'Network error' };
  }
};
