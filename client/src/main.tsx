import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";

// Add a simple component to ensure rendering occurs
const RootComponent = () => {
  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <App />
      </AuthProvider>
    </div>
  );
};

// Create the root and render
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<RootComponent />);
} else {
  console.error("Could not find root element to mount React app");
}
