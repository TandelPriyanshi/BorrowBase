import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../Component/input";
import Button from "../Component/button";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        navigate("/home");
      } else {
        const text = await res.text();
        setError(text || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl text-white font-semibold mb-6">Login to Your Account</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Email"
            type="email"
            id="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Password"
            type="password"
            id="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <Button buttonName="Login" onClick={handleLogin} />
        </form>
        <p className="mt-4 text-sm text-gray-400">
          Don’t have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
