// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/test-path'),
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: function Link({ children, href }) {
    return require('react').createElement('a', { href }, children);
  },
}));

// Mock Next.js Image component (avoids React DOM warnings from fill/priority props)
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image({ src, alt, className, width, height, fill, priority, sizes, ...rest }) {
    const imgProps = { src, alt, className };
    if (width) imgProps.width = width;
    if (height) imgProps.height = height;
    return require('react').createElement('img', imgProps);
  },
}));

// Suppress React DOM warnings in tests (from Lucide icons and other libraries)
const originalConsoleError = console.error;
const originalError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const message = args[0];

  if (
    typeof message === "string" &&
    (
      message.includes("non-boolean attribute") ||
      message.includes("empty string") ||
      message.includes("not wrapped in act") ||
      message.includes("Failed to load CDN video")
    )
  ) {
    return; // ignore
  }

  originalError(...args);
};

console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' &&
      (message.includes('Received `true` for a non-boolean attribute') ||
       message.includes('Warning:'))) {
    return;
  }
  originalConsoleWarn(...args);
};

// Mock fetch only in jsdom — Node environment has real fetch available
if (typeof window !== "undefined") {
  global.fetch = jest.fn().mockRejectedValue(new Error("fetch not available in test"));
}

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock AddressAutocomplete since Google Maps isn't available in jsdom.
// Renders a plain input that reports a trusted suggestion so forms can advance.
jest.mock('@/components/leads/AddressAutocomplete', () => ({
  __esModule: true,
  default: function AddressAutocomplete({ value, onChange }) {
    return require('react').createElement('input', {
      'aria-label': 'Property address',
      placeholder: 'Enter your property address',
      value: value ?? '',
      onChange: (e) => onChange?.(e.target.value, { source: 'google_selected', canAdvance: true }),
    });
  },
}));



jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init) => {
      const status = init?.status ?? 200;

      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
      };
    },
  },
  NextRequest: jest.fn(),
}));


// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'test-site-key',
  RECAPTCHA_SECRET_KEY: 'test-secret-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',

  GHL_API_KEY: 'test-ghl-api-key',
  GHL_LOCATION_ID: 'test-location-id',
  GHL_API_BASE_URL: 'https://services.leadconnectorhq.com',

  GOOGLE_MAPS_SERVER_KEY: 'test-google-server-key',
};
