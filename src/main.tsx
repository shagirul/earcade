import "./styles/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserProgressProvider } from "./state/userProgress";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserProgressProvider>
      <App />
    </UserProgressProvider>
  </React.StrictMode>
);
