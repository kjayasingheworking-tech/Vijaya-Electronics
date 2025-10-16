import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mobileImg from "../../Assets/mobile.jpg";
import laptopImg from "../../Assets/laptop.jpeg";
import speakerImg from "../../Assets/speaker.jpeg";

function Landing() {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  // 🖼 Carousel slides
  const slides = [
    {
      image: mobileImg,
      title: "Mobile Repairs",
      text: "Quick fixes for screens, batteries & charging issues.",
    },
    {
      image: laptopImg,
      title: "Laptop & Desktop Repairs",
      text: "Professional hardware and software troubleshooting.",
    },
    {
      image: speakerImg,
      title: "Speaker Repairs",
      text: "We bring back your sound clarity like new.",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((prev) => (prev + 1) % slides.length),
      4000
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

  // Navigation handlers
  const goCreateJob = () => navigate("/admin/create-job");
  const goAddTechnician = () => navigate("/admin/add-technician");
  const goAllJobs = () => navigate("/admin/all-jobs");
  const goModifyJob = () => navigate("/admin/modify-jobs");
  const goCheckStatus = () => navigate("/check-status");

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      {/* 🖼 Carousel Section */}
      <div className="relative w-full max-w-5xl mx-auto mt-6 rounded-2xl overflow-hidden shadow-xl h-[400px] bg-gray-200">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full bg-[#0057B8]/70 text-white text-center py-4">
              <h3 className="text-xl font-semibold">{slide.title}</h3>
              <p className="text-sm">{slide.text}</p>
            </div>
          </div>
        ))}

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 text-[#0057B8] p-2 rounded-full"
        >
          &#10094;
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 text-[#0057B8] p-2 rounded-full"
        >
          &#10095;
        </button>
      </div>

      {/* ⚙️ Role-Based Buttons */}
      <div className="text-center mt-10 flex flex-wrap justify-center gap-6">
        {/* 🔧 Admin buttons */}
        {role === "admin" && (
          <>
            <button
              onClick={goCreateJob}
              className="bg-[#FFA500] text-[#212529] font-semibold px-8 py-3 rounded-full hover:bg-[#ffb733] transition"
            >
              🧾 Create Job Card
            </button>

            <button
              onClick={goAddTechnician}
              className="bg-[#0057B8] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#00489a] transition"
            >
              ➕ Add Technician
            </button>

            <button
              onClick={goAllJobs}
              className="bg-green-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-green-700 transition"
            >
              📋 View All Jobs
            </button>

            <button
              onClick={goModifyJob}
              className="bg-white text-[#0057B8] border-2 border-[#0057B8] font-semibold px-8 py-3 rounded-full hover:bg-[#0057B8] hover:text-white transition"
            >
              ✏️ Modify Jobs
            </button>
          </>
        )}

        {/* 👤 Customer buttons */}
        {role === "customer" && (
          <button
            onClick={goCheckStatus}
            className="bg-[#0057B8] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#00489a] transition"
          >
            🔍 Check Repair Status / Modify
          </button>
        )}

        {/* 🚫 No role */}
        {!role && (
          <p className="text-gray-500 italic">
            Please select a role using the bottom-right role switcher.
          </p>
        )}
      </div>
    </div>
  );
}

export default Landing;
