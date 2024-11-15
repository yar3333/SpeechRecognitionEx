import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

const rootElement = document.createElement('div');
rootElement.setAttribute("id", "speech_recognition_settings");
const rootContainer = document.getElementById('stt_container') ?? document.getElementById('extensions_settings');
rootContainer.appendChild(rootElement);

const app = createApp(App)
app.mount(rootElement)
