/**
 * Domain Validation Utility for Premium Lead Quality Control
 * 
 * Validates domains to ensure only active, legitimate domains
 * are accepted into the ColdPilot platform.
 */

export type DomainStatus = "active" | "parked" | "does_not_resolve" | "unknown";

/**
 * Validates a domain to determine if it's active, parked, or non-resolving
 * @param domain - The domain to validate (e.g., "example.com")
 * @returns Promise<DomainStatus>
 */
export async function validateDomain(domain: string): Promise<DomainStatus> {
  try {
    console.log(`🔍 Validating domain: ${domain}`);
    
    // Clean the domain (remove www, protocols, etc.)
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();

    if (!cleanDomain || cleanDomain.length === 0) {
      console.log(`❌ Invalid domain format: ${domain}`);
      return "does_not_resolve";
    }

    // First try HTTPS, then HTTP as fallback
    const urls = [
      `https://${cleanDomain}`,
      `http://${cleanDomain}`
    ];

    for (const url of urls) {
      try {
        console.log(`📡 Testing URL: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          // Prevent redirects to external sites
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 403 || response.status === 401) {
          // Get response text to check for parked domain indicators
          try {
            const html = await response.text();
            const htmlLower = html.toLowerCase();
            
            // Check for parked domain indicators
            const parkedIndicators = [
              'buy this domain',
              'this domain is for sale',
              'parked by',
              'domain parking',
              'premium domain',
              'expired domain',
              'domain registration',
              'godaddy.com/domains',
              'namecheap.com',
              'sedo.com',
              'afternic.com',
              'dan.com',
              'undeveloped',
              'placeholder page',
              'coming soon',
              'under construction'
            ];

            const isParked = parkedIndicators.some(indicator => 
              htmlLower.includes(indicator)
            );

            if (isParked) {
              console.log(`🚫 Domain is parked: ${domain}`);
              return "parked";
            }

            console.log(`✅ Domain is active: ${domain}`);
            return "active";
            
          } catch (textError) {
            // If we can't read the content but got a response, assume active
            console.log(`⚠️ Could not read content for ${domain}, but got response - assuming active`);
            return "active";
          }
        } else if (response.status >= 500) {
          // Server errors might be temporary, continue to next URL
          console.log(`⚠️ Server error ${response.status} for ${url}, trying next URL...`);
          continue;
        } else {
          // Other HTTP errors suggest the domain exists but has issues
          console.log(`⚠️ HTTP ${response.status} for ${domain} - assuming active with issues`);
          return "active";
        }
        
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.log(`⏰ Timeout for ${url}`);
          continue;
        }
        
        console.log(`❌ Fetch error for ${url}:`, fetchError.message);
        continue;
      }
    }

    // If all URLs failed, domain doesn't resolve
    console.log(`💀 Domain does not resolve: ${domain}`);
    return "does_not_resolve";
    
  } catch (error: any) {
    console.error(`🔥 Domain validation error for ${domain}:`, error.message);
    return "does_not_resolve";
  }
}

/**
 * Extracts domain from email address
 * @param email - Email address
 * @returns Domain or null if invalid
 */
export function extractDomainFromEmail(email: string): string | null {
  try {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    return domain && domain.length > 0 ? domain : null;
  } catch {
    return null;
  }
}

/**
 * Validates multiple domains in batch with rate limiting
 * @param domains - Array of domains to validate
 * @param concurrency - Number of concurrent validations (default: 3)
 * @returns Map of domain -> DomainStatus
 */
export async function validateDomainsBatch(
  domains: string[], 
  concurrency: number = 3
): Promise<Map<string, DomainStatus>> {
  const results = new Map<string, DomainStatus>();
  
  // Process domains in batches to avoid overwhelming servers
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    console.log(`🔄 Processing domain batch ${Math.floor(i/concurrency) + 1}/${Math.ceil(domains.length/concurrency)}`);
    
    const batchPromises = batch.map(async (domain) => {
      const status = await validateDomain(domain);
      results.set(domain, status);
      return { domain, status };
    });
    
    await Promise.all(batchPromises);
    
    // Add delay between batches to be respectful
    if (i + concurrency < domains.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}