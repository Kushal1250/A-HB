import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PublicPage from "./PublicPage";
import Admin from "./Admin";
import "./styles.css";
import "./responsive.css";
import "./person-names.css";
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="admin-main">
        <h1>A tiny pause in the magic.</h1>
        <p>Please refresh the page to try again.</p>
        <button onClick={() => location.reload()}>Refresh</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <main className="admin-main">
                <h1>This page wandered off.</h1>
                <Link to="/">Back to the birthday surprise</Link>
              </main>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
