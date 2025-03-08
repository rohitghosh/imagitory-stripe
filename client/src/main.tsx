import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Create the root and render with AuthProvider
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
} else {
  console.error("Could not find root element to mount React app");
}
