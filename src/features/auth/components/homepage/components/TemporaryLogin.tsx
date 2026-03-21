/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import {
  getIdToken,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { LoginLoadingOverlay } from "@/features/auth/components/login/LoginLoadingOverlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export function TemporaryLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Form validation function
  const validateForm = (): boolean => {
    let isValid = true;
    // Reset field errors
    setEmailError(null);
    setPasswordError(null);

    // Email validation
    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await getIdToken(userCredential.user);

      // Make the API call to create the session
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }
      // Set success message
      setSuccessMessage("Login successful! Redirecting...");
      router.refresh();
      router.push("/");
    } catch (error: any) {
      console.error("Login failed", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/wrong-password") {
        setPasswordError("Invalid password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        setEmailError("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An error occurred during sign in. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setEmailError("Please enter your email to reset your password.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setEmailError("No account found with this email.");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address.");
      } else {
        setError("Failed to send password reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Show loading overlay when authenticating */}
      {isLoading && <LoginLoadingOverlay />}

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6 lg:pt-25 pb-8 sm:pb-4 lg:pb-6 w-full">
        <div className="relative z-10 flex flex-col lg:grid lg:justify-center gap-8 lg:gap-16 items-center min-h-[600px] rounded-3xl overflow-hidden">
          {/* Mobile Image - Shows on top for mobile */}
          <div
            className="lg:hidden absolute inset-0 w-full h-full z-0"
            style={{
              backgroundImage: "url('/images/searchfortruth-2.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Login Form */}
          <div className="relative w-full max-w-md z-10 animate-fade-in-up mx-auto my-auto">
            {/* Error Display */}
            {error && (
              <div className="mb-4 animate-fade-in-up">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="mb-4 animate-fade-in-up">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Login Form Container */}
            {/* Malakas Maganda BG */}
            <form
              onSubmit={handleSubmit}
              className="relative z-10 w-full rounded-2xl px-8 py-10 flex flex-col items-center gap-6"
              style={{
                background: "rgba(255, 255, 255, 0.82)",
                backdropFilter: "blur(8px) saturate(140%)",
                WebkitBackdropFilter: "blur(8px) saturate(140%)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow:
                  "0 8px 40px rgba(27, 94, 36, 0.15), 0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Logo */}
              <img
                src="/images/ussc-logo-1.webp"
                alt="USSC Connect"
                className="w-20 h-20 object-contain"
              />

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-black text-[#1F7700]">
                  USSC Connect
                </h2>
                <p className="text-sm font-semibold text-[#1F7700] mt-1 leading-relaxed">
                  Welcome Admin! Enter your credentials to sign in and access
                  your dashboard.
                </p>
              </div>

              {/* Email Field */}
              <div className="w-full space-y-2">
                <label
                  htmlFor="email"
                  className="block font-semibold text-sm text-[#1F7700]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F7700]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full h-11 pl-10 pr-4 border ${
                      emailError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#2a9902] focus:ring-[#1F7700]"
                    } rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]`}
                    disabled={isLoading}
                    placeholder="Enter your email"
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="w-full space-y-2">
                <label
                  htmlFor="password"
                  className="block font-semibold text-sm text-[#1F7700]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F7700]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full h-11 pl-10 pr-4 border ${
                      passwordError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#2a9902] focus:ring-[#1F7700]"
                    } rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]`}
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="remember"
                    className="flex items-center cursor-pointer"
                  >
                    <div className="w-5 h-5 mr-3 relative bg-white rounded border-2 border-[#1F7700] shrink-0 flex items-center justify-center">
                      {rememberMe && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 12L10 17L19 8"
                            stroke="#1b6600"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-semibold text-sm text-[#123d02]">
                      Remember me
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="font-semibold text-sm text-[#288605] underline hover:text-[#1b6600] transition-colors duration-200"
                  tabIndex={isLoading ? -1 : 0}
                  aria-disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full h-14 flex items-center gap-4 px-5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#269000" }}
                disabled={isLoading}
              >
                <span className="flex-1 text-center">
                  {isLoading ? "Signing in..." : "Sign in"}
                </span>
              </button>

              {/* Footer */}
              <p className="text-xs text-gray-400">Powered by VERIS.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
