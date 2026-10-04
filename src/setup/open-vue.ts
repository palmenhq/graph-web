import type { App } from 'vue'
import Button from 'openvue/button'
import OpenVue, { type PrimeVueConfiguration } from 'openvue/config'
import { definePreset } from '@openvue/themes'
import Aura from '@openvue/themes/aura'
import {
  AutoComplete,
  Card,
  DataView,
  Dialog,
  Drawer,
  IftaLabel,
  InputGroup,
  InputGroupAddon,
  InputText,
  Menubar,
  Panel,
  ProgressSpinner,
  Select,
  SplitButton,
  Toolbar,
} from 'openvue'

// Small inputs keep a 16px font size so mobile browsers don't zoom on focus
const Preset = definePreset(Aura, {
  semantic: {
    formField: {
      sm: {
        fontSize: '1rem',
      },
    },
  },
})

export const setupOpenVue = (app: App) => {
  app.use(OpenVue, { theme: { preset: Preset } } satisfies PrimeVueConfiguration)

  app.component('Button', Button)
  app.component('AutoComplete', AutoComplete)
  app.component('Card', Card)
  app.component('DataView', DataView)
  app.component('Dialog', Dialog)
  app.component('Drawer', Drawer)
  app.component('IftaLabel', IftaLabel)
  app.component('InputGroup', InputGroup)
  app.component('InputGroupAddon', InputGroupAddon)
  app.component('InputText', InputText)
  app.component('Menubar', Menubar)
  app.component('Panel', Panel)
  app.component('ProgressSpinner', ProgressSpinner)
  app.component('Select', Select)
  app.component('SplitButton', SplitButton)
  app.component('Toolbar', Toolbar)
}
