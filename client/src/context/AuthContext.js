import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentPath = window.location.pathname;

      if (!firebaseUser) {
        setUser(null);

        // If not already on login or register, redirect
        if (!["/login", "/register"].includes(currentPath)) {
          await signOut(auth);
          window.localStorage.removeItem("your-auth-token");
          window.location.href = "/login";
        }

        return;
      }

      setUser(firebaseUser);

      // Don't check profile if we're already on an auth/setup page
      if (!["/login", "/register", "/complete-profile"].includes(currentPath)) {
        await checkProfile(firebaseUser);
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

const checkProfile = async (firebaseUser) => {
  try {
    const token = await firebaseUser.getIdToken(true); // Force refresh token
    const res = await fetch("http://localhost:5000/api/user/check", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error("Profile check failed with status:", res.status);
      return;
    }

    const data = await res.json();

    if (!data.exists && window.location.pathname !== "/complete-profile") {
      window.location.href = "/complete-profile";
    }
  } catch (error) {
    console.error("Error during profile check:", error.message);
    window.location.href = "/login"; // fallback
  }
};
