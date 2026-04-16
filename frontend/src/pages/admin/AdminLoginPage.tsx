import React, { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { HiUser, HiLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import axios from "axios";
import { 
  useNavigate, 
  // Link 
} from "react-router-dom";
import { useAdminAuth } from "../../context/admin/auth/useAdminAuth";
import api from "../../api";
import loginImage from "../../assets/login-page-bg.png";
import logo from "../../assets/main-logo.jpg";
const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/admin/auth/login", {
        username,
        password,
      });

      if (response.data && response.data.token) {
      await login(response.data.token);
      navigate("/admin/dashboard");
    } else {
      setError("Login succeeded but no token was returned from the server.");
    }

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "An unexpected error occurred.");
      } else {
        setError("Failed to connect to the server.");
      }
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f7f7f7]">
      <div className="hidden lg:flex w-3/5 items-center justify-center bg-gray-100">
        <img
          src={loginImage}
          alt="Login Illustration"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="Logo"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-4xl font-bold text-black">Welcome Admin!</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-3 text-lg text-center text-red-800 bg-red-100 border border-red-300 rounded-md">
                {error}
              </div>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiUser className="h-6 w-6 text-black" />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                disabled={isLoading}
                className="peer w-full  text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <HiLockClosed className="h-6 w-6 text-black text-2xl" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={isLoading}
                className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <HiEyeOff className="h-6 w-6 text-black" />
                ) : (
                  <HiEye className="h-6 w-6 text-black" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex gap-3 text-xl cursor-pointer text-white font-semibold bg-gradient-to-r from-[#144a31] to-[#387c40] px-7 py-3 rounded-full border border-[#144a31] hover:scale-105 duration-200 hover:text-white hover:border-[#144a31] hover:[#387c40] hover:to-[#144a31] w-full justify-center items-center"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* <p className="text-center text-lg text-black">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-lg text-[#387c40] hover:text-[#144a31]"
            >
              Sign Up
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
