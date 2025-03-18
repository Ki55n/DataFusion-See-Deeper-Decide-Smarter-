"use client";
import { useState, useEffect } from "react";
import {
  useSignInWithEmailAndPassword,
  useSendPasswordResetEmail,
} from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { useRouter } from "next/navigation";
import { UserAuth } from "../context/AuthContext";
import Image from "next/image";

// Define the user type to match what's in AuthContext
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword, userCredential, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [sendPasswordResetEmail, sendingReset, resetError] =
    useSendPasswordResetEmail(auth);
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [loadingVerification, setLoadingVerification] = useState(false);
  const { user, loading: authLoading, googleSignIn } = UserAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log("User is authenticated, redirecting to dashboard");
      const authUser = user as AuthUser;
      if (authUser.emailVerified || authUser.email) {
        router.push("/dashboard/projects");
      }
    }
  }, [user, authLoading, router]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }

    try {
      console.log("Attempting to sign in with email:", email);
      const result = await signInWithEmailAndPassword(email, password);

      if (result?.user) {
        console.log("Sign in successful, checking email verification");
        if (result.user.emailVerified) {
          console.log("Email verified, redirecting to dashboard");
          router.push("/dashboard/projects");
        } else {
          console.log("Email not verified");
          setLoginError("Email not verified. Please check your inbox.");
          await auth.signOut(); // Force sign out if not verified
        }
      } else {
        setLoginError("Invalid email or password. Please try again.");
      }
    } catch (e: any) {
      console.error("Login error:", e.message || "Unknown error");
      setLoginError("Invalid email or password. Please try again.");
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      console.log("Attempting Google sign in");
      await googleSignIn();
    } catch (error: any) {
      console.error("Google sign-in error:", error.message || "Unknown error");
      setLoginError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Please enter your email to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      setLoginError("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error.message || "Unknown error");
      setLoginError("Failed to send password reset email. Please try again.");
    }
  };

  useEffect(() => {
    if (error) {
      console.error("Firebase auth error:", error.message);
      setLoginError("Login failed. Please check your credentials.");
    }
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-900"
      style={{
        backgroundImage: "url('/auth-bg.jpg')",
        backgroundSize: "cover",
      }}
    >
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-sm w-full">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-white">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-400 transition text-white placeholder-gray-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-400 transition text-white placeholder-gray-400"
        />
        {loginError && (
          <div className="mb-4 text-red-500 text-center">{loginError}</div>
        )}
        <button
          onClick={handleSignIn}
          className="w-full p-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition shadow-md"
          disabled={loading || loadingVerification}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div className="text-center my-4 text-gray-400">or</div>

        <button
          onClick={handleSignInWithGoogle}
          className="flex items-center justify-center w-full p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition shadow-md"
          disabled={googleLoading}
        >
          {googleLoading ? (
            "Signing in..."
          ) : (
            <>
              <Image
                alt="Google"
                src={"/google-logo.svg"}
                height={20}
                width={20}
                className="mr-3"
              />
              Sign in with Google
            </>
          )}
        </button>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-indigo-400 hover:underline"
            disabled={sendingReset}
          >
            {sendingReset ? "Sending..." : "Forgot password?"}
          </button>
          <a href="/signup" className="text-sm text-indigo-400 hover:underline">
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
