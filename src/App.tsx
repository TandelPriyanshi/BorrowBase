import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./Page/register";
import Login from "./Page/login";
import Home from "./Page/home";
import ToastProvider from "./components/ToastProvider";
import { ReviewProvider } from "./contexts/ReviewContext";

function App() {
  return (
    <ReviewProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<Home />} /> {/* All other pages via Home */}
        </Routes>
      </BrowserRouter>
      <ToastProvider />
    </ReviewProvider>
  );
}

export default App;
