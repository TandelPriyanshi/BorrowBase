import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./Page/register";
import Login from "./Page/login";
import Home from "./Page/home";
import ToastProvider from "./components/ToastProvider";
import { ReviewProvider } from "./contexts/ReviewContext";
import { AuthProvider } from "./Auth/authContext";
import ProtectedRoute from "./Auth/route";

function App() {
  return (
    <AuthProvider>
      <ReviewProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <ToastProvider />
      </ReviewProvider>
    </AuthProvider>
  );
}

export default App;
