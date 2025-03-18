"use client";
import { useContext, createContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { syncUserWithDatabase } from "@/lib/auth";

// Create AuthContext with default values
const AuthContext = createContext({
  user: null,
  dbUser: null,
  googleSignIn: () => Promise.resolve(),
  logOut: () => Promise.resolve(),
  loading: true, // Add loading state in the default context
});

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  const googleSignIn = async () => {
    try {
      console.log("Starting Google sign in process");
      const provider = new GoogleAuthProvider();
      // Return the promise so we can await it
      return await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error.message || "Unknown error");
      // Re-throw the error so it can be caught by the component
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error.message || "Unknown error");
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log(`Auth state changed: User ${currentUser.email} logged in`);
        
        // Only set basic user properties to avoid circular references
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          emailVerified: currentUser.emailVerified,
        });
        
        // Sync Firebase user with our database
        try {
          console.log(`Syncing user with database: ${currentUser.email}`);
          
          // Pass only the necessary user properties to avoid circular references
          const userForSync = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            emailVerified: currentUser.emailVerified,
          };
          
          const syncedUser = await syncUserWithDatabase(userForSync);
          if (syncedUser) {
            console.log(`User synced successfully with ID: ${syncedUser.id}`);
            setDbUser(syncedUser);
          } else {
            console.error("Failed to sync user with database");
          }
        } catch (error) {
          console.error("Error syncing user with database:", 
            typeof error === 'object' && error !== null && 'message' in error 
              ? error.message 
              : "Unknown error");
        }
      } else {
        console.log("Auth state changed: User logged out");
        setUser(null);
        setDbUser(null);
      }
      
      setLoading(false); // Set loading to false once the user state is determined
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, googleSignIn, logOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("UserAuth must be used within a AuthContextProvider");
  }
  return context;
};
