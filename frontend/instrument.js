import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./src/App";

Sentry.init({
  dsn: "https://33881920c473b9003c975ed7a4cdbbe2@o4509549105512448.ingest.de.sentry.io/4509578391191632",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById(“app”);
const root = createRoot(container);
root.render(<App />);