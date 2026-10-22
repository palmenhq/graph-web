import type { PropertyValueType } from '../api/use-node-query.ts'
import {
  isEmptyNoteBody,
  noteBodyToText,
  parseNoteBody,
} from '../design/rich-text-utils.ts'

// `copy` is what the copy button puts on the clipboard, e.g. the full profile URL for a handle
export type PropertyValueDisplay =
  | { kind: 'empty' }
  | { kind: 'text'; label: string; copy: string }
  | {
      kind: 'link'
      label: string
      href: string
      external: boolean
      copy: string
    }
  | { kind: 'textarea'; value: string; copy: string }

const handlePattern = /^[A-Za-z0-9._]{1,30}$/

// Accepts "handle", "@handle" or a profile URL ("instagram.com/handle", "https://www.tiktok.com/@handle")
const parseHandle = (raw: string, domain: string): string | null => {
  const urlMatch = raw.match(
    new RegExp(`^(?:https?://)?(?:[a-z0-9-]+\\.)*${domain}/@?([^/?#]+)`, 'i'),
  )
  const handle = urlMatch ? urlMatch[1] : raw.replace(/^@/, '')
  return handlePattern.test(handle) ? handle : null
}

export const propertyValueDisplay = (
  valueType: PropertyValueType,
  value?: string | null,
): PropertyValueDisplay => {
  const raw = value?.trim()
  if (!raw) {
    return { kind: 'empty' }
  }

  switch (valueType) {
    case 'textarea': {
      const doc = parseNoteBody(value)
      if (!doc || isEmptyNoteBody(doc)) {
        return { kind: 'empty' }
      }
      return { kind: 'textarea', value: value!, copy: noteBodyToText(doc) }
    }
    case 'instagram': {
      const handle = parseHandle(raw, 'instagram\\.com')
      if (!handle) {
        return { kind: 'text', label: raw, copy: raw }
      }
      const href = `https://www.instagram.com/${handle}/`
      return {
        kind: 'link',
        label: `@${handle}`,
        href,
        external: true,
        copy: href,
      }
    }
    case 'tiktok': {
      const handle = parseHandle(raw, 'tiktok\\.com')
      if (!handle) {
        return { kind: 'text', label: raw, copy: raw }
      }
      const href = `https://www.tiktok.com/@${handle}`
      return {
        kind: 'link',
        label: `@${handle}`,
        href,
        external: true,
        copy: href,
      }
    }
    case 'email': {
      const email = raw.replace(/^mailto:/i, '')
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? {
            kind: 'link',
            label: email,
            href: `mailto:${email}`,
            external: false,
            copy: email,
          }
        : { kind: 'text', label: raw, copy: raw }
    }
    case 'phone': {
      const phone = raw.replace(/^tel:/i, '')
      const dialable = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
      return dialable.replace('+', '').length >= 3
        ? {
            kind: 'link',
            label: phone,
            href: `tel:${dialable}`,
            external: false,
            copy: phone,
          }
        : { kind: 'text', label: raw, copy: raw }
    }
    case 'text': {
      return /^https?:\/\/\S+$/i.test(raw)
        ? { kind: 'link', label: raw, href: raw, external: true, copy: raw }
        : { kind: 'text', label: raw, copy: raw }
    }
    case 'link': {
      return {
        kind: 'link',
        label: raw.replace(/^https?:\/\/(www)?/, ''),
        href: raw,
        external: true,
        copy: raw,
      }
    }
    default:
      valueType satisfies never
      return { kind: 'text', label: raw, copy: raw }
  }
}
