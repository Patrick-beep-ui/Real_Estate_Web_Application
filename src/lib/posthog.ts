import posthog from 'posthog-js';

// PostHog free tier — no API key needed to start capturing
// Replace with your PostHog project key when you create an account
const POSTHOG_KEY = 'phc_placeholder';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  if (POSTHOG_KEY === 'phc_placeholder') {
    console.log('[PostHog] Placeholder key — tracking disabled. Set real key in src/lib/posthog.ts');
    return;
  }
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
  initialized = true;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(id: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(id, traits);
}

export { posthog };
