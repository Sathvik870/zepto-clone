import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import logo from "../../assets/cropped_circle_image.png";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth.ts";

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (config: any) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}
import {
  HiUser,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiMail,
  HiPhone,
  HiIdentification,
  HiChevronDown,
} from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import loginbg from "../../assets/login-bg.jpg";

const CustomerSignupPage: React.FC = () => {
  const { login } = useCustomerAuth();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    gender: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { confirmPassword, ...payload } = formData;
      const response = await api.post("/api/customer/auth/signup", payload);
      setSuccess("Account created successfully!");
      if (response.status === 201) {
        await login(response.data.token);
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: "385969567461-san58alnvi9frf3o32q3f5a20786bp5t.apps.googleusercontent.com",
      scope: [
        "openid",
        "email",
        "profile",
      ].join(" "),
      ux_mode: "popup",
      callback: async (response: any) => {
        try {
          const res = await api.post("/api/customer/auth/google-signup", {
            code: response.code,
          });
          setSuccess("Account created successfully!");
          const { token } = res.data;
          await login(token);
          navigate("/");
        } catch (err) {
          console.error("Google signup failed:", err);
          setError("Google signup failed. Try again.");
        }
      },
    });

    client.requestCode();
  };

  const inputClass =
    "w-full rounded-xl font-semibold border-2 border-[#144a31] bg-white/60 py-3 pl-12 pr-4 text-base text-[#144a31] outline-none transition-all duration-300 ease-in-out placeholder:text-[#144a31] focus:bg-[#d4d4d4]";

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden font-sans text-gray-800">
      <img
        src={loginbg}
        alt="Signup Background"
        className="absolute inset-0 h-full w-full object-cover -z-20"
      />
      <div className="absolute inset-0 h-full w-full bg-black/20 -z-10"></div>
      <div className="relative z-10 mx-auto flex w-11/12 max-w-xl flex-col items-center rounded-3xl border-2 border-[#144a31] bg-[#ffffff1c] p-8 text-center shadow-2xl backdrop-blur-[10px] md:p-10">
        <div className="-mt-3 mb-4 flex flex-col items-center">
          <img src={logo} alt="logo" className="h-20 w-20" />
          <h1 className="mt-2 -mb-1 text-2xl font-semibold text-gray-100 md:text-2xl">
            Create Your Account
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
          {error && (
            <div className="text-red-400 bg-red-900/50 p-3 rounded-lg -mb-1">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-300 bg-green-900/50 p-3 rounded-lg -mb-1">
              {success}
            </div>
          )}

          <div className="-mt-1 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/2">
                <HiIdentification className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="first_name"
                  type="text"
                  placeholder="First Name"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="relative w-full sm:w-1/2">
                <HiIdentification className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="last_name"
                  type="text"
                  placeholder="Last Name"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/2">
                <HiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="username"
                  type="text"
                  placeholder="Username"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="relative w-full sm:w-1/2">
                <HiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="phone_number"
                  type="tel"
                  placeholder="Phone Number"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/2">
                <HiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <select
                  name="gender"
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  value={formData.gender}
                  className="w-full appearance-none rounded-xl font-semibold border-2 border-[#144a31] bg-white/60 py-3 pl-12 pr-10 text-base text-[#144a31] outline-none transition-all duration-300 ease-in-out focus:bg-[#d4d4d4] focus:placeholder:text-[#144a31] focus:text-[#144a31] cursor-pointer"
                >
                  <option value="" disabled hidden>
                    Select Gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <HiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#144a31] text-xl transition-transform duration-300 peer-focus:rotate-180" />
              </div>
              <div className="relative w-full sm:w-1/2">
                <HiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/2">
                <HiLockClosed className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31] focus:outline-none"
                >
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
              <div className="relative w-full sm:w-1/2">
                <HiLockClosed className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31] focus:outline-none"
                >
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="flex mt-1 gap-3 text-xl bg-white/60 cursor-pointer text-[#144a31] font-semibold px-7 py-3 rounded-full border-2 backdrop-blur-[50px] border-[#144a31] hover:scale-105 duration-200 w-full justify-center items-center hover:bg-[#d4d4d4] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-2 flex items-center justify-center w-full">
          <div className="h-[1px] w-full bg-[#144a31]/40"></div>
          <span className="px-3 text-gray-200 font-semibold">or</span>
          <div className="h-[1px] w-full bg-[#144a31]/40"></div>
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="mt-2 flex items-center justify-center gap-3 text-lg font-semibold text-[#144a31] border-2 border-[#144a31] bg-white/60 rounded-full px-6 py-3 backdrop-blur-[50px] hover:scale-105 hover:bg-[#d4d4d4] transition-all duration-300 w-full"
        >
          <FcGoogle className="text-2xl" />
          Sign Up with Google
        </button>

        <div className="mt-4 flex items-center text-white gap-1 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-gray-300 transition-colors duration-300 hover:text-[#6bb794] hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignupPage;
