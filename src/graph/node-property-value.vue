<script setup lang="ts">
import { computed } from 'vue'
import type { PropertyValueType } from '../api/use-node-query.ts'

const props = defineProps<{
  valueType: PropertyValueType
  value?: string | null
}>()

type Display =
  | { kind: 'empty' }
  | { kind: 'text'; label: string }
  | { kind: 'link'; label: string; href: string; external: boolean }

const handlePattern = /^[A-Za-z0-9._]{1,30}$/

// Accepts "handle", "@handle" or a profile URL ("instagram.com/handle", "https://www.tiktok.com/@handle")
const parseHandle = (raw: string, domain: string): string | null => {
  const urlMatch = raw.match(
    new RegExp(`^(?:https?://)?(?:[a-z0-9-]+\\.)*${domain}/@?([^/?#]+)`, 'i'),
  )
  const handle = urlMatch ? urlMatch[1] : raw.replace(/^@/, '')
  return handlePattern.test(handle) ? handle : null
}

const display = computed<Display>(() => {
  const raw = props.value?.trim()
  if (!raw) {
    return { kind: 'empty' }
  }

  switch (props.valueType) {
    case 'instagram': {
      const handle = parseHandle(raw, 'instagram\\.com')
      return handle
        ? {
            kind: 'link',
            label: `@${handle}`,
            href: `https://www.instagram.com/${handle}/`,
            external: true,
          }
        : { kind: 'text', label: raw }
    }
    case 'tiktok': {
      const handle = parseHandle(raw, 'tiktok\\.com')
      return handle
        ? {
            kind: 'link',
            label: `@${handle}`,
            href: `https://www.tiktok.com/@${handle}`,
            external: true,
          }
        : { kind: 'text', label: raw }
    }
    case 'email': {
      const email = raw.replace(/^mailto:/i, '')
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? {
            kind: 'link',
            label: email,
            href: `mailto:${email}`,
            external: false,
          }
        : { kind: 'text', label: raw }
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
          }
        : { kind: 'text', label: raw }
    }
    default:
      return /^https?:\/\/\S+$/i.test(raw)
        ? { kind: 'link', label: raw, href: raw, external: true }
        : { kind: 'text', label: raw }
  }
})
</script>

<template>
  <span v-if="display.kind === 'empty'" class="property-value empty">
    Empty
  </span>
  <a
    v-else-if="display.kind === 'link'"
    class="property-value link"
    target="_blank"
    :href="display.href"
    :title="display.href"
    v-bind="
      display.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
    "
  >
    {{ display.label }}
  </a>
  <span v-else class="property-value">{{ display.label }}</span>
</template>

<style scoped>
.property-value {
  min-width: 0;
  overflow-wrap: anywhere;
}

.property-value.empty {
  color: var(--p-text-muted-color);
}

.property-value.link {
  color: var(--p-primary-color);
  text-decoration: none;
}

.property-value.link:hover {
  text-decoration: underline;
}
</style>
