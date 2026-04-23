import './style.css'
import App from './App.svelte'
import { mount } from 'svelte'

const target = document.getElementById('app')

if (!target) {
  throw new Error('App target element not found')
}

// @ts-ignore -- VS Code TS service can mis-type .svelte imports as legacy constructors
const app = mount(App, { target })

export default app
