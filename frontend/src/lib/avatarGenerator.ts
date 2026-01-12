/**
 * Local avatar generation utility
 * Replaces external DiceBear API calls with local SVG generation
 */

interface AvatarOptions {
  seed: string;
  backgroundColor?: string;
  type?: 'initials' | 'avataaars';
  size?: number;
}

/**
 * Generate initials from a name or seed
 */
function getInitials(seed: string): string {
  // Remove special characters and split by common delimiters
  const words = seed
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/[\s]+/)
    .filter(word => word.length > 0);
  
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  
  // Take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate a consistent color from a string seed
 */
function generateColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate pleasing colors (avoid too dark or too light)
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 45 + (hash % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate an initials-based avatar SVG
 */
function generateInitialsAvatar(options: AvatarOptions): string {
  const { seed, backgroundColor, size = 40 } = options;
  const initials = getInitials(seed);
  const bgColor = backgroundColor || generateColorFromSeed(seed);
  const fontSize = size * 0.4;
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="6"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${fontSize}" 
        font-weight="600" 
        fill="white"
      >${initials}</text>
    </svg>
  `)}`;
}

/**
 * Generate a simple avatar with a person icon
 */
function generateAvataaarsAvatar(options: AvatarOptions): string {
  const { seed, size = 40 } = options;
  const bgColor = generateColorFromSeed(seed);
  
  // Simple person silhouette
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}" rx="6"/>
      <g transform="translate(${size * 0.5}, ${size * 0.5})">
        <circle cx="0" cy="${size * -0.1}" r="${size * 0.15}" fill="white" opacity="0.9"/>
        <ellipse cx="0" cy="${size * 0.2}" rx="${size * 0.25}" ry="${size * 0.3}" fill="white" opacity="0.9"/>
      </g>
    </svg>
  `)}`;
}

/**
 * Main function to generate avatar URL
 * Compatible with DiceBear API URL format
 */
export function generateAvatar(seed: string, options: Partial<AvatarOptions> = {}): string {
  const type = options.type || 'initials';
  const fullOptions: AvatarOptions = {
    seed,
    size: 40,
    ...options,
  };
  
  if (type === 'avataaars') {
    return generateAvataaarsAvatar(fullOptions);
  }
  
  return generateInitialsAvatar(fullOptions);
}

/**
 * Parse DiceBear URL and generate local equivalent
 * Example: https://api.dicebear.com/7.x/initials/svg?seed=John&backgroundColor=dc2626
 */
export function replaceDicebearUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a DiceBear URL
    if (!urlObj.hostname.includes('dicebear.com')) {
      return url; // Not a DiceBear URL, return as-is
    }
    
    // Extract type from path (initials or avataaars)
    const pathParts = urlObj.pathname.split('/');
    const type = pathParts.includes('initials') ? 'initials' : 'avataaars';
    
    // Extract query parameters
    const params = new URLSearchParams(urlObj.search);
    const seed = params.get('seed') || 'Unknown';
    const backgroundColor = params.get('backgroundColor') ? `#${params.get('backgroundColor')}` : undefined;
    
    return generateAvatar(seed, { type, backgroundColor });
  } catch (error) {
    console.warn('Failed to parse DiceBear URL:', url, error);
    return generateAvatar('Unknown');
  }
}

/**
 * Hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default {
  generateAvatar,
  replaceDicebearUrl,
};









