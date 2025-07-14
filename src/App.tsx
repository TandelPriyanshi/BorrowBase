import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./Page/register";
import Login from "./Page/login";
import Home from "./Page/home";
import Chat from "./MainComponent/chat"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat/:chatId" element={<Chat />} /> 
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
