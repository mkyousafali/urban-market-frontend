import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Admin from "./Admin";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 24, marginBottom: 32, background: "#eee", padding: 16 }}>
        <Link to="/">Admin Panel</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
