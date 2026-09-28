// src/modules/auth/utils/geolocation.ts

import fetch from 'node-fetch';

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

/**
 * Cache per evitare chiamate ripetute allo stesso IP
 * TTL: 24 ore
 */
const geoCache = new Map<string, { data: GeoLocation; expires: number }>();

/**
 * Geolocalizza un IP usando ipapi.co (gratuito, 30k req/mese)
 * Con cache 24h per ottimizzare chiamate
 */
export async function geolocateIP(ip: string | undefined): Promise<GeoLocation> {
  const defaultGeo: GeoLocation = {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC',
  };

  // IP invalidi (localhost, privati)
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { ...defaultGeo, country: 'Local Network' };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000, // 3s timeout
    });

    if (!response.ok) {
      console.warn(`[geolocation] API error for ${ip}: ${response.status}`);
      return defaultGeo;
    }

    const data: any = await response.json();

    // Check per rate limit
    if (data.error) {
      console.warn(`[geolocation] API error: ${data.reason}`);
      return defaultGeo;
    }

    const geo: GeoLocation = {
      country: data.country_name || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'UTC',
    };

    // Cache 24h
    geoCache.set(ip, {
      data: geo,
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return geo;
  } catch (error: any) {
    console.error(`[geolocation] Fetch error for ${ip}:`, error.message);
    return defaultGeo;
  }
}

/**
 * Pulisce cache vecchia (chiamare periodicamente)
 */
export function cleanGeoCache(): void {
  const now = Date.now();
  for (const [ip, entry] of geoCache.entries()) {
    if (entry.expires <= now) {
      geoCache.delete(ip);
    }
  }
}
