"use client";
import { useEffect, useState } from "react";
import {
  useCreateUserWithEmailAndPassword,
  useSendEmailVerification,
} from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { UserAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createUser, getUserByEmail } from "@/services/userService";

// Define the user type to match what's in AuthContext
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createUserWithEmailAndPassword, userCredential, loading, createUserError] =
    useCreateUserWithEmailAndPassword(auth);
  const [sendEmailVerification, sending, verificationError] =
    useSendEmailVerification(auth);
  const router = useRouter();
  const { googleSignIn, user, loading: authLoading } = UserAuth();
  const [popupVisible, setPopupVisible] = useState(false);
  const [alertmsg, setAlertmsg] = useState("");
  const [passwordError, setPasswordError] = useState(""); // Password error state
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password validation logic
  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long.`;
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!hasNumber) {
      return "Password must contain at least one number.";
    }
    return "";
  };

  const handleSignUp = async () => {
    const passwordValidationMessage = validatePassword(password);
    if (passwordValidationMessage) {
      setPasswordError(passwordValidationMessage); // Set the password error
      return;
    }

    try {
      // Check if user already exists in database
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        console.log("User already exists in database");
        setAlertmsg("User Already exists");
        setPopupVisible(true);
        setTimeout(() => {
          setPopupVisible(false);
          router.push("/login");
        }, 5000);
        return;
      }

      // Create user with email and password in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        email,
        password
      );

      console.log("Firebase user created:", email);

      if (userCredential) {
        // Firebase user ID
        const userId = userCredential.user.uid;

        try {
          // Create a new user in database
          const newUser = await createUser({
            name: "john doe",
            email: email,
          });
          
          console.log("User created in database:", newUser ? "success" : "failed");

          // Send email verification
          const success = await sendEmailVerification();
          if (success) {
            console.log("Verification email sent");
            setAlertmsg("Email verification sent! Redirecting to login...");
            setPopupVisible(true);

            // Show popup and redirect to login after delay
            setTimeout(() => {
              setPopupVisible(false);
              router.push("/login");
            }, 5000);

            setEmail("");
            setPassword("");
          }
        } catch (error: any) {
          console.error("Error creating user in database:", error.message || "Unknown error");
          setAlertmsg("Error creating user. Please try again.");
          setPopupVisible(true);
        }
      }
    } catch (e: any) {
      console.error("Error in signup:", e.message || "Unknown error");
      setAlertmsg("Error creating account. Please try again.");
      setPopupVisible(true);
    }
  };

  const handleSignIn = async () => {
    try {
      setGoogleLoading(true);
      // Don't redirect here - let the AuthContext handle it
      await googleSignIn();
      // Remove the premature redirect
    } catch (error: any) {
      console.log("Google sign-in error:", error.message || "Unknown error");
      setAlertmsg("Error signing in with Google. Please try again.");
      setPopupVisible(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Add useEffect to handle redirection when user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log("User is authenticated, redirecting to dashboard");
      // Check if email is verified for email/password sign-in
      const authUser = user as AuthUser;
      if (authUser.emailVerified || authUser.email) {
        router.push("/dashboard/projects");
      }
    }
  }, [user, authLoading, router]);

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
          Sign Up
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
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(""); // Reset error when typing
          }}
          className="w-full p-3 mb-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-indigo-400 transition text-white placeholder-gray-400"
        />
        {passwordError && (
          <div className="text-red-500 text-sm mb-4">{passwordError}</div>
        )}
        <button
          onClick={handleSignUp}
          className="w-full p-3 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition shadow-md"
          disabled={sending || loading}
        >
          {sending ? "Sending Verification..." : loading ? "Creating Account..." : "Sign Up"}
        </button>

        {popupVisible && (
          <div className="mt-4 p-3 bg-green-600 text-white text-center rounded-lg">
            {alertmsg}
          </div>
        )}

        <div className="text-center my-4 text-gray-400">or</div>

        <button
          onClick={handleSignIn}
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
          <div className="text-sm text-gray-400">Already have an account?</div>
          <a href="/login" className="text-sm text-indigo-400 hover:underline">
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}
