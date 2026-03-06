// src/modules/auth/utils/deviceDetection.ts

import UAParser from 'ua-parser-js';

export interface DeviceInfo {
  device: string;  // 'Desktop', 'Mobile', 'Tablet'
  os: string;      // 'Windows 11', 'iOS 17.2'
  browser: string; // 'Chrome 120.0'
}

/**
 * Estrae informazioni device/OS/browser dal User-Agent
 */
export function parseUserAgent(userAgent: string | undefined): DeviceInfo {
  if (!userAgent) {
    return {
      device: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
    };
  }

  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Device type
    let device = 'Desktop';
    if (result.device.type === 'mobile') device = 'Mobile';
    else if (result.device.type === 'tablet') device = 'Tablet';

    // OS name + version
    const osName = result.os.name || 'Unknown OS';
    const osVersion = result.os.version || '';
    
    // Fix Windows 11 detection: Windows 11 usa stesso User-Agent di Windows 10
    // Mostra "Windows 10/11" per chiarezza
    let os = osVersion ? `${osName} ${osVersion}` : osName;
    if (osName === 'Windows' && osVersion?.startsWith('10')) {
      os = 'Windows 10/11';
    }

    // Browser name + version
    const browserName = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version || '';
    const browser = browserVersion ? `${browserName} ${browserVersion}` : browserName;

    return { device, os, browser };
  } catch (error) {
    console.error('[deviceDetection] Parse error:', error);
    return {
      device: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown',
    };
  }
}
