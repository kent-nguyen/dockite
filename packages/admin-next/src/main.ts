import ElementPlus from 'element-plus';
import * as Vue from 'vue';

import './assets/tailwind.css';
import './assets/element.scss';

import { App } from './App';
import { Router } from './router';
import { defineGlobals } from './utils';

const app = Vue.createApp(App);

(app.config as any).devtools = true;

defineGlobals(app);

app.use(Router);
app.use(ElementPlus);

app.mount('#app');
