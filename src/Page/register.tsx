import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/input";
import Button from "../components/button";
import { FaUser, FaHome, FaEnvelope, FaLock } from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    agree: false,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async () => {
    if (!formData.agree) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/register", {
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
        setError(text || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-lg w-full max-w-2xl">
        <h2 className="text-3xl text-white font-bold mb-8 text-center">Create an Account</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Full Name"
              type="text"
              id="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              icon={<FaUser className="text-gray-400" />}
            />
            <Input
              label="Address"
              type="text"
              id="address"
              placeholder="123 Main St, City"
              value={formData.address}
              onChange={handleChange}
              icon={<FaHome className="text-gray-400" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              label="Email"
              type="email"
              id="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              icon={<FaEnvelope className="text-gray-400" />}
            />
            <Input
              label="Password"
              type="password"
              id="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              icon={<FaLock className="text-gray-400" />}
            />
          </div>
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agree"
              checked={formData.agree}
              onChange={handleChange}
              className="mr-2 accent-blue-500"
            />
            <label htmlFor="agree" className="text-gray-300 text-sm">
              I agree to the{" "}
              <a href="#" className="font-bold underline" target="_blank" rel="noopener noreferrer">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="font-bold underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button buttonName="Register" onClick={handleRegister} />
        </form>
        <p className="mt-6 text-center text-gray-400">
          Already have an account?{" "}
          <span
            className="text-blue-400 font-bold cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;