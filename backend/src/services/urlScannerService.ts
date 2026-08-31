/**
 * Zero-Trust URL Scanner Service
 * Extracts URLs from text/documents and applies heuristic safety analysis.
 */

const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

const DENYLIST_DOMAINS = [
  'fake-registry-clone.xyz',
  'phishing-notary.cc',
  'malicious-deed.net',
  'land-registry-clone.com',
  'trustledger-fake.io',
];

const LOOKALIKE_PATTERNS = [
  /l[a4]nd[-_]?reg[i1]stry/i,   // land-registry lookalikes
  /gov\.uk\./i,                   // subdomain of gov.uk used as TLD trick
  /trustledger\.(?!network)/i,    // trustledger.* other than trustledger.network
];

const TRUSTED_DOMAINS = [
  'land-registry.gov.uk',
  'trustledger.network',
  'hm-land-registry.gov.uk',
];

export interface URLScanResult {
  url: string;
  verdict: 'safe' | 'unsafe';
  reason?: string;
}

export interface URLScanSummary {
  urlsFound: string[];
  safeUrls: string[];
  unsafeUrls: string[];
  verdict: 'safe' | 'unsafe' | 'pending';
  results: URLScanResult[];
}

/**
 * Extract all URLs found in a text string.
 */
export function extractURLs(text: string): string[] {
  const matches = text.match(URL_REGEX) || [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Analyse a single URL for security risks.
 */
export function scanURL(rawUrl: string): URLScanResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { url: rawUrl, verdict: 'unsafe', reason: 'Malformed URL' };
  }

  const hostname = url.hostname.toLowerCase();

  // 1. Protocol check
  if (url.protocol !== 'https:') {
    return { url: rawUrl, verdict: 'unsafe', reason: 'Non-HTTPS protocol detected' };
  }

  // 2. Explicit denylist
  if (DENYLIST_DOMAINS.some((d) => hostname.includes(d))) {
    return { url: rawUrl, verdict: 'unsafe', reason: 'Domain on security denylist' };
  }

  // 3. Lookalike domain detection
  for (const pattern of LOOKALIKE_PATTERNS) {
    if (pattern.test(hostname)) {
      const isTrusted = TRUSTED_DOMAINS.some((t) => hostname === t);
      if (!isTrusted) {
        return {
          url: rawUrl,
          verdict: 'unsafe',
          reason: `Potential lookalike domain mimicking trusted registry: ${hostname}`,
        };
      }
    }
  }

  // 4. Excessive subdomains (phishing trick: registry.gov.uk.attacker.com)
  const parts = hostname.split('.');
  if (parts.length > 4) {
    return {
      url: rawUrl,
      verdict: 'unsafe',
      reason: 'Excessive subdomain depth — potential domain spoofing',
    };
  }

  // 5. IP address URLs
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return { url: rawUrl, verdict: 'unsafe', reason: 'Raw IP address URL — suspicious' };
  }

  return { url: rawUrl, verdict: 'safe' };
}

/**
 * Scan all URLs found in a block of text and produce a summary verdict.
 */
export function scanDocumentURLs(text: string): URLScanSummary {
  const urlsFound = extractURLs(text);

  if (urlsFound.length === 0) {
    return {
      urlsFound: [],
      safeUrls: [],
      unsafeUrls: [],
      verdict: 'safe',
      results: [],
    };
  }

  const results = urlsFound.map(scanURL);
  const safeUrls = results.filter((r) => r.verdict === 'safe').map((r) => r.url);
  const unsafeUrls = results.filter((r) => r.verdict === 'unsafe').map((r) => r.url);

  return {
    urlsFound,
    safeUrls,
    unsafeUrls,
    verdict: unsafeUrls.length > 0 ? 'unsafe' : 'safe',
    results,
  };
}
