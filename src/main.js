import { createApp } from 'vue';
import { Quasar } from 'quasar';
import { createPinia } from 'pinia';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';

// Import Quasar css
import 'quasar/dist/quasar.css';

// Import app and stores
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(Quasar, {
	plugins: {}, // import Quasar plugins and add here
});

app.mount('#app');
