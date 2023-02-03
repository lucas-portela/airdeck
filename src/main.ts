import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDye481KpUMZI7rt7EVwbGhHCJrzdAHu4s",
  authDomain: "airdeck-online.firebaseapp.com",
  projectId: "airdeck-online",
  storageBucket: "airdeck-online.appspot.com",
  messagingSenderId: "581906379925",
  appId: "1:581906379925:web:f59e6e17403ce296b5979c",
  measurementId: "G-NBZZKJYK1J",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
getAnalytics(firebaseApp);

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
