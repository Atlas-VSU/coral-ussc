/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  getIdToken,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebase/firebase.config";
import { LoginLoadingOverlay } from "@/features/auth/components/login/LoginLoadingOverlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation"

export function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const router = useRouter()

  // Validate form on input changes after first submission attempt
  useEffect(() => {
    if (formSubmitted) {
      validateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, formSubmitted]);

  // Clear field-specific errors when fields change
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
    setFormSubmitted(true);
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
        password
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

      router.refresh()

      // // Navigate directly without setTimeout and without resetting isLoading
      // window.location.href = "/org-dashboard";
      router.push("/")
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
      setFormSubmitted(true);
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
    <div className="min-h-[100%] bg-white dark:bg-background relative overflow-hidden flex items-center justify-center animate-fade-in">
      {/* Show loading overlay when authenticating */}
      {isLoading && <LoginLoadingOverlay />}

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-6 pb-8 sm:pb-4 lg:pb-6 w-full">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[500px]">
          {/* Mobile Image - Shows on top for mobile */}
          <div className="lg:hidden w-full flex justify-center items-center order-1 animate-fade-in-up animation-delay-200">
            <div className="w-full max-w-[1200px] flex justify-center">
              <Image
                src="/images/enhanced-logo-final.png"
                alt="SAMS Illustration"
                width={200}
                height={150}
                className="w-auto h-auto object-contain max-w-full max-h-[180px]"
                priority
              />
            </div>
          </div>

          {/* Left Side - Login Form */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:max-w-none flex flex-col justify-center order-2 lg:order-1">
            {/* Title and Subtitle */}
            <div className="mb-4 lg:mb-6 text-center lg:text-left animate-fade-in-up animation-delay-300">
              <h1 className="font-nunito text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-black dark:text-foreground leading-[1.1] lg:leading-tight mb-2 lg:mb-3 tracking-tight">
                Sign in to CORAL
              </h1>
              <p className="font-nunito-sans text-sm sm:text-base lg:text-lg xl:text-xl text-[#5B5B5B] dark:text-muted-foreground leading-relaxed font-medium tracking-wide">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 animate-fade-in-up animation-delay-400">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="mb-6 animate-fade-in-up animation-delay-400">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Login Form Container */}
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-card border border-[#767676] dark:border-border rounded-[20px] sm:rounded-[30px] lg:rounded-[40px] p-4 sm:p-6 lg:p-8 w-full max-w-[480px] sm:max-w-[500px] lg:max-w-[520px] mx-auto lg:mx-0 shadow-lg dark:shadow-2xl animate-fade-in-up animation-delay-500"
            >
              {/* Email Field */}
              <div className="space-y-2 animate-fade-in-up animation-delay-600">
                <label
                  htmlFor="email"
                  className="block font-instrument text-lg sm:text-xl text-[#272727] dark:text-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-[#696969] dark:text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full h-[44px] sm:h-[48px] lg:h-[50px] pl-10 sm:pl-11 pr-4 border ${
                      emailError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#696969] dark:border-border focus:ring-[#008ACF] dark:focus:ring-primary"
                    } rounded-[14px] bg-white dark:bg-input font-instrument text-base sm:text-lg text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                    disabled={isLoading}
                    placeholder="Enter your email"
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2 mt-4 animate-fade-in-up animation-delay-700">
                <label
                  htmlFor="password"
                  className="block font-instrument text-lg sm:text-xl text-[#272727] dark:text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-[#696969] dark:text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full h-[44px] sm:h-[48px] lg:h-[50px] pl-10 sm:pl-11 pr-4 border ${
                      passwordError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#696969] dark:border-border focus:ring-[#008ACF] dark:focus:ring-primary"
                    } rounded-[14px] bg-white dark:bg-input font-instrument text-base sm:text-lg text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 pb-1 space-y-3 sm:space-y-0 animate-fade-in-up animation-delay-800">
                <div className="flex items-center space-x-2">
                  <div className="relative">
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
                      <div className="w-6 h-6 mr-3 relative">
                        {rememberMe ? (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                              fill="currentColor"
                              className="text-[#111111] dark:text-foreground"
                            />
                          </svg>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-400 dark:border-border rounded"></div>
                        )}
                      </div>
                      <span className="font-poppins text-base text-[#333] dark:text-foreground">
                        Remember me
                      </span>
                    </label>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="font-instrument text-base text-[#008ACF] dark:text-primary underline hover:text-[#0f73a5] dark:hover:text-primary/80 transition-colors duration-200 inline-block"
                    tabIndex={isLoading ? -1 : 0}
                    aria-disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-6 animate-fade-in-up animation-delay-900">
                <button
                  type="submit"
                  className="w-full max-w-[180px] sm:max-w-[200px] h-12 sm:h-14 lg:h-16 bg-[#008ACF] dark:bg-primary text-white dark:text-primary-foreground font-poppins text-sm sm:text-base lg:text-[18px] rounded-xl hover:bg-[#0f73a5] dark:hover:bg-primary/90 transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                  disabled={
                    isLoading ||
                    (formSubmitted &&
                      (!email || !password || !!emailError || !!passwordError))
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side - Illustration (Desktop only) */}
          <div className="hidden lg:flex justify-center items-center order-3 lg:order-2 animate-fade-in-left animation-delay-400">
            <div className="w-full max-w-[450px] flex justify-center">
              <Image
                src="/images/enhanced-logo-final.png"
                alt="SAMS Illustration"
                width={450}
                height={340}
                className="w-auto h-auto object-contain max-w-full max-h-[380px]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
