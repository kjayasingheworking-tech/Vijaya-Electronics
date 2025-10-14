import React, { useEffect, useState } from "react";
import { LogOut, Zap, Star, Heart, ZapOff } from "lucide-react";

export default function AdminDashboard() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) =>
    d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        :root {
          --orange: #FFA500;
          --blue: #0057B8;
          --bg1: #030a17;
          --bg2: #041f3d;
          --bg3: #07193a;
          --text: #f2f6ff;
          --muted: #98a2b3;
        }

        body {
          margin: 0;
          font-family: Inter, system-ui, sans-serif;
          background: var(--bg1);
          color: var(--text);
        }

        .adminWrap {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(160deg, var(--bg1), var(--bg2), var(--bg3));
        }

        /* animated glow orbs */
        .bgOrb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
          animation: pulse 5s ease-in-out infinite alternate;
        }
        .blueOrb {
          width: 320px;
          height: 320px;
          background: var(--blue);
          top: -60px;
          left: -40px;
        }
        .orangeOrb {
          width: 380px;
          height: 380px;
          background: var(--orange);
          bottom: -80px;
          right: -40px;
        }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.3; }
          to { transform: scale(1.1); opacity: 0.5; }
        }

        /* header */
        .adminHeader {
          position: relative;
          z-index: 10;
          background: linear-gradient(90deg, var(--blue), var(--orange));
          padding: 14px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }
        .logoutBtn {
          background: #fff;
          color: var(--blue);
          border: none;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.2s;
        }
        .logoutBtn:hover {
          background: var(--orange);
          color: #000;
        }

        /* main */
        .adminMain {
          position: relative;
          z-index: 5;
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 20px 40px;
        }

        /* hero layout: text left, clock right */
        .heroSection {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 50px;
          flex-wrap: wrap;
          margin-bottom: 80px;
        }

        .heroText {
          flex: 1;
          min-width: 280px;
        }
        .heroTitle {
          font-size: clamp(32px, 5vw, 50px);
          font-weight: 800;
          background: linear-gradient(90deg, var(--orange), #fff, #00b4d8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 14px;
          text-shadow: 0 0 12px rgba(255, 184, 0, 0.3);
        }
        .heroSub {
          color: #c9d3e0;
          max-width: 700px;
          font-size: 1.1rem;
          line-height: 1.6;
        }
        .highlight-yellow { color: #ffd166; }
        .highlight-blue { color: #00b4d8; }

        /* clock */
        .clockBox {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 30px 50px;
          box-shadow: 0 0 30px rgba(255, 200, 0, 0.25);
          transition: 0.3s;
          text-align: center;
        }
        .clockBox:hover { box-shadow: 0 0 45px rgba(255, 200, 0, 0.6); }
        .time { font-size: 2rem; font-weight: 700; color: #ffd166; margin-bottom: 8px; }
        .date { color: var(--muted); font-size: 0.95rem; }

        /* cards */
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 28px;
          margin-bottom: 70px;
          text-align: center;
        }
        .card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 28px 20px;
          backdrop-filter: blur(10px);
          transition: 0.3s;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .card:hover { transform: scale(1.04); box-shadow: 0 0 40px rgba(255, 200, 0, 0.45); }

        /* ✅ FIXED ICON STYLE — no ellipse */
        .iconWrap {
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(6px);
          box-shadow: 0 0 12px rgba(255, 200, 0, 0.3);
          margin-left: auto;
          margin-right: auto;
        }

        .card h3 { font-size: 1.4rem; margin-bottom: 10px; }
        .card p { color: #d1d7e2; font-size: 0.95rem; line-height: 1.5; }

        .divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 50px auto 30px;
          width: 60%;
        }
        .quote {
          text-align: center;
          font-style: italic;
          color: #b8c2d5;
          font-size: 1.1rem;
          margin-bottom: 40px;
        }
        .footer {
          text-align: center;
          font-size: 0.9rem;
          color: #b4bed0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
        }

        @media (max-width: 768px) {
          .heroSection { flex-direction: column; align-items: center; text-align: center; }
          .clockBox { margin-top: 20px; }
        }
      `}</style>

      <div className="adminWrap">
        <div className="bgOrb blueOrb"></div>
        <div className="bgOrb orangeOrb"></div>



        <main className="adminMain">
          <div className="heroSection">
            <div className="heroText">
              <h2 className="heroTitle">
                Welcome Back, Admin <ZapOff size={34} style={{ verticalAlign: "middle" }} />
              </h2>
              <p className="heroSub">
                You’re the <span className="highlight-yellow">spark</span> that keeps
                <span className="highlight-blue"> Electra </span> glowing — empowering teams,
                energizing progress, and leading innovation forward.
              </p>
            </div>

            <div className="clockBox">
              <p className="time">{formatTime(time)}</p>
              <p className="date">{formatDate(time)}</p>
            </div>
          </div>

          <div className="cards">
            <Card
              icon={<Zap size={32} color="#FFD166" />}
              title="Empower"
              text="Each supplier you onboard amplifies Electra’s strength — driving reliability and innovation."
            />
            <Card
              icon={<Heart size={32} color="#FF6EC7" />}
              title="Inspire"
              text="Your leadership ignites collaboration — uniting the network to achieve shared excellence."
            />
            <Card
              icon={<Star size={32} color="#00B4D8" />}
              title="Achieve"
              text="Every decision illuminates the path forward — powering progress across the system."
            />
          </div>

          <hr className="divider" />
          <p className="quote">
            “Electric energy doesn’t just power systems — it powers{" "}
            <span className="highlight-yellow">progress</span>.” ⚡
          </p>

          <footer className="footer">
            © {new Date().getFullYear()} <b>Electra Admin</b> · Crafted with ⚡{" "}
            <span className="highlight-blue">vision</span> and purpose.
          </footer>
        </main>
      </div>
    </>
  );
}

function Card({ icon, title, text }) {
  return (
    <div className="card">
      <div className="iconWrap">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
