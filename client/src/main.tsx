import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create the root and render the app
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error("Could not find root element to mount React app");
}
