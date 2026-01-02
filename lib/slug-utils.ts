/**
 * Slug Generation Utility
 * Generates URL-friendly slugs from text input
 */

/**
 * Generate a URL-friendly slug from any text
 * @param text - Input text to convert to slug
 * @returns URL-friendly slug string
 * 
 * @example
 * generateSlug('Power Bank 20000mAh') // returns 'power-bank-20000mah'
 * generateSlug('Gaming Laptop Pro!!!') // returns 'gaming-laptop-pro'
 */
export function generateSlug(text: string): string {
  if (!text || text.trim() === '') {
    return 'product-' + Date.now();
  }
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100) || 'product-' + Date.now();
}

/**
 * Generate a unique slug by appending a counter if needed
 * @param baseSlug - Base slug to check
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 0;
  
  while (existingSlugs.includes(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}

/**
 * Validate if a string is a valid slug format
 * @param slug - Slug to validate
 * @returns true if valid slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim() === '') return false;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Extract readable title from slug
 * @param slug - Slug to convert back to title
 * @returns Human-readable title
 */
export function slugToTitle(slug: string): string {
  if (!slug || slug.trim() === '') return '';
  
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
