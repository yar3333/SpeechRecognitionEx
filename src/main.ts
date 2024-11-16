import './assets/main.css'
//import { saveSettingsDebounced } from './sillytavern-script.js'

import { createApp } from 'vue'
import App from './App.vue'

//import './index.js'
//saveSettingsDebounced();

const rootContainer = document.getElementById('extensions_settings')!;
const rootElement = document.createElement('div');
rootContainer.appendChild(rootElement);

const app = createApp(App)
app.mount(rootElement)
