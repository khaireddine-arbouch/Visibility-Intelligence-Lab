/**
 * Formats a query string to title case
 * Also removes surrounding double quotes, if present.
 * Example: "birthright citizenship" -> "Birthright Citizenship"
 */
export function formatQuery(query: string): string {
  if (!query) return query

  // Remove all leading and trailing quotes (straight quotes " and curly quotes "" "")
  query = query.trim()
  
  // Remove quotes from start - handle both straight and curly quotes
  query = query.replace(/^["""\u201C\u201D\u201E\u201F]+/, '')
  
  // Remove quotes from end - handle both straight and curly quotes  
  query = query.replace(/["""\u201C\u201D\u201E\u201F]+$/, '')
  
  // Final trim
  query = query.trim()

  return query
    .split(/\s+/)
    .map(word => {
      // Handle special cases like "US", "UK", etc.
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word
      }
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
