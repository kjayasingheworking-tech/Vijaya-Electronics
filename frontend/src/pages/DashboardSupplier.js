import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Factory,
  PackageSearch,
  ClipboardList,
  Bell,
  UploadCloud,
  Settings,
  Truck,
  Clock,
} from "lucide-react";

export default function SupplierDashboard() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        :root {
          --bg1: #0f172a;
          --bg2: #1e293b;
          --yellow: #FFD166;
          --orange: #FFB800;
          --text: #f1f5f9;
          --muted: #9ca3af;
        }

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: var(--bg1);
          color: var(--text);
        }

        .supplierWrap {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(160deg, var(--bg1), var(--bg2));
        }

        /* Glowing Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          animation: pulse 5s ease-in-out infinite alternate;
        }
        .orb.yellow { background: linear-gradient(90deg, rgba(255,200,0,0.3), rgba(255,150,0,0.3)); width: 400px; height: 400px; top: -80px; left: -80px; }
        .orb.blue { background: linear-gradient(180deg, rgba(0,150,255,0.3), rgba(0,255,255,0.25)); width: 480px; height: 480px; bottom: -100px; right: -60px; }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.25; }
          to { transform: scale(1.1); opacity: 0.45; }
        }

        /* Welcome Section */
        .welcome {
          max-width: 1100px;
          margin: 100px auto 60px;
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px;
          padding: 60px;
          box-shadow: 0 0 40px rgba(255,200,0,0.15);
          position: relative;
        }
        .welcome h1 {
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800;
          background: linear-gradient(90deg, var(--yellow), var(--orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          text-shadow: 0 0 12px rgba(255,184,0,0.3);
        }
        .welcome p {
          color: #dce2ee;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 750px;
        }

        /* DateTime bubble */
        .timeBox {
          position: absolute;
          top: 30px;
          right: 40px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 16px 22px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 20px rgba(255, 200, 0, 0.2);
        }
        .timeBox svg { color: var(--yellow); }
        .timeText {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
          line-height: 1.3;
        }
        .timeMain {
          font-weight: 600;
          color: var(--yellow);
          font-size: 1.1rem;
        }
        .timeSub {
          color: var(--muted);
          font-size: 0.85rem;
        }

        /* Grid Cards */
        .grid4 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto 80px;
          padding: 0 20px;
        }
        .card {
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .card:hover { transform: scale(1.05); box-shadow: 0 0 40px rgba(255,200,0,0.4); }
        .cardInner {
          padding: 30px 22px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .cardIcon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .card h3 { font-size: 1.4rem; margin-bottom: 10px; color: var(--text); }
        .card p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; }

        /* Details */
        .grid3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto 80px;
          padding: 0 20px;
        }
        .detail {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .detail:hover { transform: scale(1.03) translateY(-4px); box-shadow: 0 0 35px rgba(255,200,0,0.3); }
        .detailInner {
          padding: 28px;
          height: 100%;
        }
        .detailTop {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .detailTop h3 { font-size: 1.3rem; color: var(--text); }
        .detail p { color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; }

        .footer {
          text-align: center;
          color: #9aa6ba;
          font-size: 0.9rem;
          padding-bottom: 40px;
        }

        @media (max-width: 768px) {
          .timeBox {
            position: relative;
            margin: 0 auto 20px;
            right: auto;
            top: auto;
            justify-content: center;
          }
          .welcome { text-align: center; padding: 40px 25px; }
          .welcome p { margin: 0 auto; }
        }
      `}</style>

      <div className="supplierWrap">
        <div className="orb yellow"></div>
        <div className="orb blue"></div>

        {/* Welcome Section with TimeBox */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="welcome"
        >
          <div className="timeBox">
            <Clock size={20} />
            <div className="timeText">
              <span className="timeMain">{time}</span>
              <span className="timeSub">{date}</span>
            </div>
          </div>

          <h1>Welcome back, Supplier ⚙️</h1>
          <p>
            Step into your power zone! Manage your <span style={{ color: "#FFD166" }}>products</span>,
            track <span style={{ color: "#FFD166" }}>orders</span>, and stay updated with Electra's latest
            supplier announcements — all through a seamless and elegant experience.
          </p>
        </motion.section>

        {/* Highlights */}
        <section className="grid4">
          {[
            {
              icon: PackageSearch,
              title: "Orders",
              text: "Monitor your purchase orders and dispatch progress.",
            },
            {
              icon: Factory,
              title: "Products",
              text: "Keep your inventory fresh and manage stock updates.",
            },
            {
              icon: ClipboardList,
              title: "Invoices",
              text: "View, download, and track all your invoices with ease.",
            },
            {
              icon: Bell,
              title: "Announcements",
              text: "Stay in the loop with the latest Electra updates.",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="card"
            >
              <div className="cardInner">
                <div className="cardIcon">
                  <card.icon color="#FFD166" size={26} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Extra Details */}
        <section className="grid3">
          <DetailCard
            icon={UploadCloud}
            title="Upload Price List"
            text="Easily refresh your catalog by uploading new CSV or Excel files. Keep your product data up to date with a few clicks."
          />
          <DetailCard
            icon={Truck}
            title="Shipments"
            text="Stay informed about deliveries and dispatch statuses — manage logistics smoothly with live tracking visibility."
          />
          <DetailCard
            icon={Settings}
            title="Preferences"
            text="Customize your experience — update supplier profile, manage notifications, and tune your workspace for success."
          />
        </section>

        {/* Footer */}
        <footer className="footer">
          ⚡ Powered by Electra Supplier Suite <br />
          © {new Date().getFullYear()} Electra Technologies — All Rights Reserved
        </footer>
      </div>
    </>
  );
}

function DetailCard({ icon: Icon, title, text }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="detail"
    >
      <div className="detailInner">
        <div className="detailTop">
          <Icon size={22} color="#FFD166" />
          <h3>{title}</h3>
        </div>
        <p>{text}</p>
      </div>
    </motion.div>
  );
}
