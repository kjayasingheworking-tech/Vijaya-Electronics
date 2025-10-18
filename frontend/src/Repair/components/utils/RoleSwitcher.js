import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/**
 * Dev helper used in the Repair sub-app to quickly assume a role.
 * Instead of mutating localStorage directly, this component now
 * uses the project's AuthContext.login/logout to set the active user
 * so the rest of the app behaves like a real authenticated user.
 */
const RoleSwitcher = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("electra_user") || "null") || {};
    } catch {
      return {};
    }
  };

  const token = localStorage.getItem("token") || null;

  const assumeRole = (role, redirect = "/") => {
    const stored = getStoredUser();
    const user = {
      ...stored,
      role,
      name: stored.name || (role === "admin" ? "Dev Admin" : "Dev Customer"),
      email: stored.email || `${role}@local.dev`,
    };

    // Use the AuthContext login so storage and state are consistent
    login({ token, user });
    navigate(redirect, { replace: true });
  };

  const clearRole = async () => {
    // Use the official logout flow to clear server/session state too
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-3 flex flex-col gap-2 border border-gray-200 z-50">
      <button
        onClick={() => assumeRole("admin", "/admin")}
        className="bg-[#0057B8] text-white px-3 py-1 rounded hover:bg-[#00489a]"
      >
        Admin
      </button>
      <button
        onClick={() => assumeRole("customer", "/")}
        className="bg-[#FFA500] text-black px-3 py-1 rounded hover:bg-[#ffb733]"
      >
        Customer
      </button>
      <button
        onClick={clearRole}
        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
      >
        Clear
      </button>
    </div>
  );
};

export default RoleSwitcher;
