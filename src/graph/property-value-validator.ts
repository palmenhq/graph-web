import type { PropertyValueType } from '../api/use-node-query.ts'

// Mirrors the backend's PropertyValueValidator

// e.g. "instagram.com/", "www.instagram.com/", "https://instagram.com/" and "https://www.instagram.com/"
const socialPrefixes = (domain: string): string[] =>
  ['', 'https://'].flatMap((scheme) =>
    ['', 'www.'].map((www) => scheme + www + domain),
  )

const instagramPrefixes = socialPrefixes('instagram.com/')
const tiktokPrefixes = socialPrefixes('tiktok.com/')
const linkPrefixes = ['https://', 'http://']

// A bare handle, optionally prefixed with @, e.g. "alice" or "@alice.b_"
const handleRegex = /^@?[A-Za-z0-9._]{1,30}$/
const phoneRegex = /^\+?[0-9 ()-]+$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const hasPrefixAndRest = (value: string, prefixes: string[]): boolean =>
  prefixes.some(
    (prefix) =>
      value.toLowerCase().startsWith(prefix) && value.length > prefix.length,
  )

export const isValidPropertyValue = (
  valueType: PropertyValueType,
  value: string,
): boolean => {
  switch (valueType) {
    case 'text':
    case 'textarea':
      return true
    case 'instagram':
      return (
        handleRegex.test(value) || hasPrefixAndRest(value, instagramPrefixes)
      )
    case 'tiktok':
      return handleRegex.test(value) || hasPrefixAndRest(value, tiktokPrefixes)
    case 'link':
      return hasPrefixAndRest(value, linkPrefixes) && !/\s/.test(value)
    case 'phone': {
      const digits = value.replace(/\D/g, '').length
      return phoneRegex.test(value) && digits >= 5 && digits <= 15
    }
    case 'email':
      return emailRegex.test(value)
    default:
      valueType satisfies never
      return true
  }
}
