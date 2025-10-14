// src/context/AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

function setAuthStorage({ token, user }) {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("electra_user", JSON.stringify(user));
}
function clearAuthStorage() {
  ["token", "electra_user", "user"].forEach((k) => localStorage.removeItem(k));
}
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("electra_user") || "null"); }
  catch { return null; }
}
function getToken() { return localStorage.getItem("token"); }

// one-time migration: move token out of electra_user, drop legacy "user"
(function migrateAuthStorage() {
  try {
    const eu = JSON.parse(localStorage.getItem("electra_user") || "null");
    if (eu?.token) {
      if (!getToken()) localStorage.setItem("token", eu.token);
      delete eu.token;
      localStorage.setItem("electra_user", JSON.stringify(eu));
    }
  } catch {}
  if (localStorage.getItem("user")) {
    try {
      const legacy = JSON.parse(localStorage.getItem("user"));
      if (legacy && !getStoredUser()) {
        const { token, ...rest } = legacy;
        if (!getToken() && token) localStorage.setItem("token", token);
        localStorage.setItem("electra_user", JSON.stringify(rest));
      }
    } catch {}
    localStorage.removeItem("user");
  }
})();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [booted, setBooted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) { setBooted(true); return; }

    (async () => {
      try {
        const { data } = await api.get("/auth/me"); // should return { user }
        if (data?.user) {
          setUser(prev => {
            const merged = { ...(prev || {}), ...data.user };
            setAuthStorage({ user: merged }); // keep token as-is
            return merged;
          });
        }
      } catch (err) {
        // 401/expired → hard logout
        clearAuthStorage();
        setUser(null);
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  // expect login(payload) to be { token, user }
  const login = ({ token, user }) => {
    setAuthStorage({ token, user });
    setUser(user);
  };

const logout = async () => {
  try {
    // call API before clearing storage so token is still sent
    await api.post("/auth/logout");
  } catch (e) {
    console.warn("Logout request failed (ignored):", e?.response?.status || e?.message);
  }

  // Clear storage
  clearAuthStorage();
  setUser(null);

  // Send user to Home
  window.location.replace("/");
};

  const value = useMemo(() => ({ user, login, logout, booted }), [user, booted]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
