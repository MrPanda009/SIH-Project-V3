
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { register as registerServiceWorker } from "./serviceWorkerRegistration.ts";

  registerServiceWorker();

  createRoot(document.getElementById("root")!).render(<App />);
  