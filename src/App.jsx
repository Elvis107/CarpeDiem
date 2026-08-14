import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Entrance from "./pages/Entrance";
import Exit from "./pages/Exit";
import ProtectedRoute from "./components/ProtectedRoute";
import ParkingInfo from "./pages/ParkingInfo";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ParkingInfo />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/entrada"
          element={
            <ProtectedRoute>
              <Entrance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salida"
          element={
            <ProtectedRoute>
              <Exit />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}