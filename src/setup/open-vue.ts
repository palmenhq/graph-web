import type { App } from 'vue'
import Button from 'openvue/button'
import OpenVue, { type PrimeVueConfiguration } from 'openvue/config'
import Aura from '@openvue/themes/aura'
import {
  Card,
  Drawer,
  IftaLabel,
  InputText,
  Menubar,
  Panel,
  ProgressSpinner,
  SplitButton,
  Toolbar,
} from 'openvue'

export const setupOpenVue = (app: App) => {
  app.use(OpenVue, { theme: { preset: Aura } } satisfies PrimeVueConfiguration)

  app.component('Button', Button)
  app.component('Card', Card)
  app.component('Drawer', Drawer)
  app.component('IftaLabel', IftaLabel)
  app.component('InputText', InputText)
  app.component('Menubar', Menubar)
  app.component('Panel', Panel)
  app.component('ProgressSpinner', ProgressSpinner)
  app.component('SplitButton', SplitButton)
  app.component('Toolbar', Toolbar)
}
