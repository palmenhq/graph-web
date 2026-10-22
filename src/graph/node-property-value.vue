<script setup lang="ts">
import { computed } from 'vue'
import type { PropertyValueType } from '../api/use-node-query.ts'
import RichText from '../design/rich-text.vue'
import { propertyValueDisplay } from './property-value-display.ts'

const props = defineProps<{
  valueType: PropertyValueType
  value?: string | null
}>()

const display = computed(() =>
  propertyValueDisplay(props.valueType, props.value),
)
</script>

<template>
  <span v-if="display.kind === 'empty'" class="property-value empty">
    Empty
  </span>
  <a
    v-else-if="display.kind === 'link'"
    class="property-value link"
    :href="display.href"
    :title="display.href"
    v-bind="
      display.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
    "
  >
    {{ display.label }}
  </a>
  <RichText
    v-else-if="display.kind === 'textarea'"
    class="property-value"
    :content="display.value"
  />
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
