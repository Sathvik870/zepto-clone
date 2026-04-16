import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from "../../api";

import loginImage from "../../assets/login-page-bg.png";
import {
  HiUser,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiMail,
  HiPhone,
  HiIdentification,
} from "react-icons/hi";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const apiPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone_number: formData.phoneNumber,
        password: formData.password,
        role: "admin",
      };

      await api.post("/api/admin/auth/signup", apiPayload);

      setSuccessMessage(
        "Thank you for your interest! Your account requires confirmation from a superior before you can log in."
      );
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "An unexpected error occurred.");
      } else {
        setError("Failed to connect to the server.");
      }
      console.error("Signup failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f7f7f7]">
      <div className="hidden lg:flex w-3/5 items-center justify-center bg-gray-100">
        <img
          src={loginImage}
          alt="Illustration"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="Logo"
                className="object-cover w-full h-full"
              />
            </div>
          </div> */}

          <div className="text-center">
            <h2 className="text-4xl font-bold text-black">Create Account</h2>
          </div>

          {successMessage ? (
            <div className="text-center space-y-4">
              <p className="p-4 text-lg text-center text-green-800 bg-green-100 border border-green-300 rounded-md">
                {successMessage}
              </p>
              <Link
                to="/agentlogin"
                className="text-lg text-[#387c40] hover:text-[#144a31] font-semibold"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-lg text-center text-red-800 bg-red-100 border border-red-300 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <div className="relative w-1/2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <HiIdentification className="h-6 w-6 text-black" />
                  </span>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                    className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                  />
                </div>
                <div className="relative w-1/2">
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                    className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pr-4 pl-2 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                  />
                </div>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiUser className="h-6 w-6 text-black" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  disabled={isLoading}
                  className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiMail className="h-6 w-6 text-black" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  disabled={isLoading}
                  className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiPhone className="h-6 w-6 text-black" />
                </span>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                  disabled={isLoading}
                  className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiLockClosed className="h-6 w-6 text-black" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  disabled={isLoading}
                  className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-6 w-6 text-black" />
                  ) : (
                    <HiEye className="h-6 w-6 text-black" />
                  )}
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <HiLockClosed className="h-6 w-6 text-black" />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  disabled={isLoading}
                  className="peer w-full text-xl bg-transparent border-b-2 placeholder-black border-gray-300 py-3 pl-10 pr-4 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
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
                {isLoading ? "Signing Up..." : "Sign Up"}
              </button>
              {/* 
              <p className="text-center text-lg text-black">
                Already have an account?{" "}
                <Link
                  to="/agentlogin"
                  className="text-lg text-[#387c40] hover:text-[#144a31]"
                >
                  Login
                </Link>
              </p> */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
