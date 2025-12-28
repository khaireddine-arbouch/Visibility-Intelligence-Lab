/**
 * Geopolitical analysis metrics
 * Measures perspective asymmetries and informational displacement
 */

export interface GeoMediaEntry {
  query: string
  outlet: string
  outletCountry: string
  querySubject: string // Country/region the query is about
  rank: number
}

/**
 * Calculate Perspective Asymmetry Index (PAI)
 * Ratio of foreign visibility to local visibility for a given topic
 * ∞ indicates complete local displacement
 */
export function calculatePAI(
  entries: GeoMediaEntry[],
  subjectCountry: string,
  observerCountry: string
): number | string {
  // Filter entries about the subject country
  const relevantEntries = entries.filter((e) => e.querySubject === subjectCountry)

  const localVisibility = relevantEntries.filter((e) => e.outletCountry === subjectCountry).length

  const foreignVisibility = relevantEntries.filter((e) => e.outletCountry === observerCountry).length

  if (localVisibility === 0) return '∞'
  return foreignVisibility / localVisibility
}

/**
 * Calculate cross-border coverage matrix
 * Shows which countries' media covers which topics
 */
export function calculateCoverageMatrix(
  entries: GeoMediaEntry[],
  countries: string[],
  subjects: string[]
): number[][] {
  const matrix: number[][] = Array(countries.length)
    .fill(0)
    .map(() => Array(subjects.length).fill(0))

  entries.forEach((entry) => {
    const countryIdx = countries.indexOf(entry.outletCountry)
    const subjectIdx = subjects.indexOf(entry.querySubject)

    if (countryIdx >= 0 && subjectIdx >= 0) {
      matrix[countryIdx][subjectIdx]++
    }
  })

  // Convert to percentages
  subjects.forEach((_, subjectIdx) => {
    const total = matrix.reduce((sum, row) => sum + row[subjectIdx], 0)
    if (total > 0) {
      countries.forEach((_, countryIdx) => {
        matrix[countryIdx][subjectIdx] = (matrix[countryIdx][subjectIdx] / total) * 100
      })
    }
  })

  return matrix
}

/**
 * Calculate informational sovereignty index
 * Measures local media presence in local topics (0-100)
 */
export function calculateInformationalSovereignty(
  entries: GeoMediaEntry[],
  country: string
): number {
  const localQueries = entries.filter((e) => e.querySubject === country)
  if (localQueries.length === 0) return 0

  const localMedia = localQueries.filter((e) => e.outletCountry === country).length

  return (localMedia / localQueries.length) * 100
}

/**
 * Calculate media imperialism score
 * Measures foreign dominance in local information space
 */
export function calculateMediaImperialismScore(
  entries: GeoMediaEntry[],
  dominantCountry: string,
  targetCountry: string
): number {
  const localQueries = entries.filter((e) => e.querySubject === targetCountry)
  if (localQueries.length === 0) return 0

  const dominantMedia = localQueries.filter((e) => e.outletCountry === dominantCountry).length

  return (dominantMedia / localQueries.length) * 100
}

