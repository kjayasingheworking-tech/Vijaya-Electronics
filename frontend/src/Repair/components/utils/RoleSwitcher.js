import React from "react";

const RoleSwitcher = () => {
  const setAdmin = () => {
    localStorage.setItem("role", "admin");
    window.location.href = "/admin";
  };

  const setCustomer = () => {
    localStorage.setItem("role", "customer");
    window.location.href = "/";
  };

  const clearRole = () => {
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-3 flex flex-col gap-2 border border-gray-200 z-50">
      <button
        onClick={setAdmin}
        className="bg-[#0057B8] text-white px-3 py-1 rounded hover:bg-[#00489a]"
      >
        Admin
      </button>
      <button
        onClick={setCustomer}
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
