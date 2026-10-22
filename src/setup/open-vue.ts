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

const Preset = definePreset(Aura, {
  semantic: {
    formField: {
      sm: {
        fontSize: '1rem',
      },
    },
    overlay: {
      modal: {
        padding: 'var(--app-overlay-padding)',
      },
    },
  },
  components: {
    panel: {
      root: {
        background: 'var(--app-panel-background)',
        borderColor: 'var(--app-panel-border-color)',
        borderRadius: 'var(--app-panel-border-radius)',
      },
      header: {
        padding: 'var(--app-panel-header-padding)',
      },
      content: {
        padding: 'var(--app-panel-padding)',
      },
      footer: {
        padding: 'var(--app-panel-padding)',
      },
      css: `
        @media (max-width: 640px) {
          .p-panel + .p-panel {
            border-top: 1px solid var(--p-content-border-color);
            padding-top: 1rem;
          }

          .p-panel-header {
            gap: 0.75rem;
          }

          .p-panel-title {
            font-size: 1.125rem;
          }
        }
      `,
    },
    card: {
      body: {
        padding: 'var(--app-card-padding)',
      },
      title: {
        fontSize: 'var(--app-card-title-font-size)',
      },
    },
    dialog: {
      header: {
        padding: 'var(--app-overlay-header-padding)',
      },
    },
    drawer: {
      header: {
        padding: 'var(--app-overlay-header-padding)',
      },
      css: `
        .p-drawer {
          max-width: 100vw;
        }
      `,
    },
  },
})

export const setupOpenVue = (app: App) => {
  app.use(OpenVue, {
    theme: { preset: Preset },
  } satisfies PrimeVueConfiguration)

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
