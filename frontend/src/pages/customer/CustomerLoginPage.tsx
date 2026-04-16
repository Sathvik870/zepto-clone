import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import logo from "../../assets/cropped_circle_image.png";
import { HiUser, HiLockClosed, HiEye, HiEyeOff } from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import loginbg from "../../assets/login-bg.jpg";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth.ts";

const LoginPage: React.FC = () => {
  const { login } = useCustomerAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/customer/auth/login", {
        identifier,
        password,
      });

      if (response.status === 200) {
        await login(response.data.token);
        navigate("/");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID =
      "385969567461-san58alnvi9frf3o32q3f5a20786bp5t.apps.googleusercontent.com";

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: ["openid", "email", "profile"].join(" "),
      ux_mode: "popup",
      callback: async (response: any) => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await api.post("/api/customer/auth/google-login", {
            code: response.code,
          });

          const { token } = res.data;
          
          await login(token);
          navigate("/");
        } catch (err: any) {
          console.error("Google login failed:", err);
          if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else if (err.message) {
            setError(`Google login failed: ${err.message}`);
          } else {
            setError("Something went wrong during Google login.");
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
    client.requestCode();
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden font-sans text-gray-800">
      <img
        src={loginbg}
        alt="Login Background"
        className="absolute inset-0 h-full w-full object-cover -z-20"
      />
      <div className="absolute inset-0 h-full w-full bg-black/20 -z-10"></div>
      <div className="relative z-10 mx-auto flex w-11/12 max-w-md flex-col items-center rounded-3xl border-2 border-[#144a31] bg-[#ffffff1c] p-8 text-center shadow-2xl backdrop-blur-[10px] md:p-10">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="logo" className="h-20 w-20" />
          <h1 className="mt-4 mb-2 text-2xl font-semibold text-gray-100 md:text-2xl">
            Log in to Your Account
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className=" -mt-3.5 flex w-full flex-col gap-5"
        >
          {error && (
            <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="relative w-full">
            <HiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
            <input
              type="text"
              placeholder="Email, Phone, Username, or Code"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl font-semibold border-2 border-[#144a31] bg-white/60  py-3 pl-12 pr-4 text-base text-[#144a31] outline-none transition-all duration-300 ease-in-out placeholder:text-[#144a31] focus:placeholder:text-[#144a31] focus:bg-[#d4d4d4]"
              required
              disabled={isLoading}
            />
          </div>
          <div className="relative w-full">
            <HiLockClosed className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#144a31]" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl font-semibold border-2 border-[#144a31] bg-white/60 py-3 pl-12 pr-4 text-base text-[#144a31] outline-none transition-all duration-300 ease-in-out placeholder:text-[#144a31] focus:placeholder:text-[#144a31] focus:bg-[#d4d4d4]"
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

          <div className="-mt-3.5 flex items-center justify-end text-sm text-gray-300">
            <a
              href="#"
              className="text-gray-300 transition-colors duration-300 hover:text-[#6bb794] hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="flex -mt-2  gap-3 text-xl bg-white/60 cursor-pointer text-[#144a31] font-semibold
                       px-7 py-3 rounded-full border-2 backdrop-blur-[50px] border-[#144a31] 
                       hover:scale-105 duration-200 w-full justify-center items-center hover:bg-[#d4d4d4]"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-2 flex items-center justify-center w-full my-5">
          <div className="h-[1px] w-full bg-[#144a31]/40"></div>
          <span className="px-3 text-gray-200 font-semibold">or</span>
          <div className="h-[1px] w-full bg-[#144a31]/40"></div>
        </div>
        <button
          onClick={handleGoogleLogin}
          className=" -mt-2 flex items-center justify-center gap-3 text-lg font-semibold text-[#144a31]
                     border-2 border-[#144a31] bg-white/60 rounded-full px-6 py-3
                     backdrop-blur-[50px] hover:scale-105 hover:bg-[#d4d4d4] transition-all duration-300 w-full"
        >
          <FcGoogle className="text-2xl" />
          Login with Google
        </button>
        <div className="mt-5 flex items-center text-white gap-1 text-sm">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-gray-300 transition-colors duration-300 hover:text-[#6bb794] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
