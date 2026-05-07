// Enhanced geocoding utility with caching and error handling
class GeocodingService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.requestQueue = new Map();
    this.isProcessing = new Map();
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests (Nominatim limit)
  }

  // Get cached results or fetch new ones
  async geocode(query) {
    const cacheKey = query.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached result for:', query);
        return cached.results;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Check if already processing this query
    if (this.isProcessing.has(cacheKey)) {
      console.log('Already processing:', query);
      return await this.isProcessing.get(cacheKey);
    }

    // Rate limiting - wait if needed
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Mark as processing and create the promise
    const processingPromise = this.processGeocode(query, cacheKey);
    this.isProcessing.set(cacheKey, processingPromise);

    try {
      const results = await processingPromise;
      this.lastRequestTime = Date.now();
      return results;
    } finally {
      this.isProcessing.delete(cacheKey);
    }
  }

  // Actual geocoding implementation
  async processGeocode(query, cacheKey) {
    try {
      // Try Nominatim first with better error handling
      const results = await this.tryNominatim(query);
      if (results && results.length > 0) {
        // Cache successful results
        this.cache.set(cacheKey, {
          results,
          timestamp: Date.now()
        });
        return results;
      }

      // If Nominatim fails or returns no results, try fallback
      console.log('Nominatim returned no results, trying fallback');
      const fallbackResults = await this.trySimpleFallback(query);
      if (fallbackResults && fallbackResults.length > 0) {
        this.cache.set(cacheKey, {
          results: fallbackResults,
          timestamp: Date.now()
        });
        return fallbackResults;
      }

      // If all services fail, return empty array
      console.log('No results from any service');
      return [];
    } catch (error) {
      console.error('Geocoding failed:', error);
      // Try fallback even on error
      try {
        const fallbackResults = await this.trySimpleFallback(query);
        if (fallbackResults && fallbackResults.length > 0) {
          this.cache.set(cacheKey, {
            results: fallbackResults,
            timestamp: Date.now()
          });
          return fallbackResults;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      return [];
    }
  }

  // Primary service - Nominatim with better error handling
  async tryNominatim(query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      console.log('Fetching from Nominatim:', query);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'RideFlex/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        // Rate limited - don't throw error, just return empty
        console.log('Nominatim rate limited, using fallback');
        return [];
      }

      if (!response.ok) {
        console.warn(`Nominatim error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log('Nominatim results:', data?.length);
      return (data || []).slice(0, 5).map(item => ({
        ...item,
        source: 'nominatim'
      }));
    } catch (error) {
      console.warn('Nominatim fetch error:', error);
      return [];
    }
  }

  // Simple fallback for common locations
  async trySimpleFallback(query) {
    const lowerQuery = query.toLowerCase().trim();
    console.log('Fallback called with query:', lowerQuery);
    
    // Common city mappings
    const cityMappings = {
      'new delhi': [{ place_id: 'delhi1', display_name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, source: 'fallback' }],
      'delhi': [{ place_id: 'delhi1', display_name: 'Delhi, India', lat: 28.6139, lon: 77.2090, source: 'fallback' }],
      'mumbai': [{ place_id: 'mumbai1', display_name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, source: 'fallback' }],
      'bangalore': [{ place_id: 'bangalore1', display_name: 'Bangalore, India', lat: 12.9716, lon: 77.5946, source: 'fallback' }],
      'bengaluru': [{ place_id: 'bangalore1', display_name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, source: 'fallback' }],
      'hyderabad': [{ place_id: 'hyderabad1', display_name: 'Hyderabad, India', lat: 17.3850, lon: 78.4867, source: 'fallback' }],
      'pune': [{ place_id: 'pune1', display_name: 'Pune, India', lat: 18.5204, lon: 73.8567, source: 'fallback' }],
      'kolkata': [{ place_id: 'kolkata1', display_name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, source: 'fallback' }],
      'chennai': [{ place_id: 'chennai1', display_name: 'Chennai, India', lat: 13.0827, lon: 80.2707, source: 'fallback' }],
      'current location': [{ place_id: 'current', display_name: 'Current Location', lat: 28.6139, lon: 77.2090, source: 'fallback' }]
    };

    console.log('Available cities:', Object.keys(cityMappings));
    
    // Fuzzy match for partial queries
    if (cityMappings[lowerQuery]) {
      console.log('Exact match found:', lowerQuery);
      return cityMappings[lowerQuery];
    }

    // Try partial matches
    const matches = Object.keys(cityMappings).filter(city => city.includes(lowerQuery));
    console.log('Partial matches:', matches);
    if (matches.length > 0) {
      return matches.map(city => cityMappings[city][0]);
    }

    console.log('No matches found in fallback');
    return [];
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries())
    };
  }
}

// Singleton instance
const geocodingService = new GeocodingService();

export default geocodingService;
