import React, { useEffect, useState } from "react";
import { LogOut, Zap, Star, Heart, ZapOff, Download, FileText, BarChart3 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api/axios';

export default function AdminDashboard() {
  const [time, setTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    totalSuppliers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalInvoices: 0,
    totalTickets: 0,
    recentActivity: [],
    loading: true
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));
      
      // Fetch data from multiple endpoints
      const [suppliersRes, customersRes] = await Promise.allSettled([
        api.get('/suppliers'),
        api.get('/users?role=customer')
      ]);

      const stats = {
        totalSuppliers: suppliersRes.status === 'fulfilled' ? suppliersRes.value.data?.length || 0 : 0,
        totalCustomers: customersRes.status === 'fulfilled' ? customersRes.value.data?.length || 0 : 0,
        totalProducts: Math.floor(Math.random() * 500) + 100, // Simulated data
        totalOrders: Math.floor(Math.random() * 200) + 50,
        totalInvoices: Math.floor(Math.random() * 150) + 30,
        totalTickets: Math.floor(Math.random() * 75) + 15,
        recentActivity: [
          { type: 'Order', description: 'New purchase order #PO-2024-001', time: '2 hours ago' },
          { type: 'Supplier', description: 'ABC Electronics supplier approved', time: '4 hours ago' },
          { type: 'Ticket', description: 'Customer support ticket resolved', time: '6 hours ago' },
          { type: 'Invoice', description: 'Invoice #INV-2024-045 processed', time: '8 hours ago' }
        ],
        loading: false
      };

      setDashboardData(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchDashboardData();
    return () => clearInterval(timer);
  }, []);

  // PDF Generation Function
  const generatePDFReport = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 87, 184); // Blue color
      pdf.text('Vijaya Electronics - Admin Dashboard Report', 20, 30);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 45);
      
      // Add statistics section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('System Statistics', 20, 65);
      
      pdf.setFontSize(12);
      let yPos = 80;
      
      const stats = [
        { label: 'Total Suppliers', value: dashboardData.totalSuppliers },
        { label: 'Total Customers', value: dashboardData.totalCustomers },
        { label: 'Total Products', value: dashboardData.totalProducts },
        { label: 'Total Orders', value: dashboardData.totalOrders },
        { label: 'Total Invoices', value: dashboardData.totalInvoices },
        { label: 'Support Tickets', value: dashboardData.totalTickets }
      ];

      // Create a 2-column layout for stats
      stats.forEach((stat, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 30 + (col * 90);
        const y = yPos + (row * 15);
        pdf.text(`${stat.label}: ${stat.value}`, x, y);
      });

      // Add recent activity section
      yPos += Math.ceil(stats.length / 2) * 15 + 20;
      pdf.setFontSize(16);
      pdf.text('Recent Activity', 20, yPos);
      
      yPos += 15;
      pdf.setFontSize(10);
      dashboardData.recentActivity.forEach((activity, index) => {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 30;
        }
        // Truncate long descriptions
        const description = activity.description.length > 60 ? 
          activity.description.substring(0, 60) + '...' : activity.description;
        pdf.text(`${activity.type}: ${description} (${activity.time})`, 30, yPos + (index * 12));
      });

      // Add summary section
      yPos += dashboardData.recentActivity.length * 12 + 20;
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 30;
      }
      
      pdf.setFontSize(16);
      pdf.text('Summary', 20, yPos);
      
      yPos += 15;
      pdf.setFontSize(12);
      const totalItems = dashboardData.totalSuppliers + dashboardData.totalCustomers + dashboardData.totalProducts;
      pdf.text(`Total system entities: ${totalItems}`, 30, yPos);
      pdf.text(`System uptime: ${formatTime(time)}`, 30, yPos + 15);
      pdf.text(`Report generated by: Admin Dashboard`, 30, yPos + 30);

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Confidential - Vijaya Electronics Internal Report', 20, pageHeight - 20);
      pdf.text(`Page 1 of ${pdf.internal.getNumberOfPages()}`, pageWidth - 50, pageHeight - 20);

      // Save the PDF
      pdf.save(`Vijaya-Electronics-Admin-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

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
          margin-bottom: 50px;
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

        /* PDF Download Button */
        .pdfButton {
          background: linear-gradient(135deg, #ff6b6b, #ffa500);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }
        .pdfButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
        }

        /* Stats Section */
        .statsSection {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 50px;
          backdrop-filter: blur(10px);
        }
        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .statItem {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .statNumber {
          font-size: 2rem;
          font-weight: 700;
          color: #ffd166;
          margin-bottom: 8px;
        }
        .statLabel {
          color: #c9d3e0;
          font-size: 0.9rem;
        }

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                <img 
                  src="/vijayaElectronics.jpg" 
                  alt="Vijaya Electronics" 
                  style={{ height: '60px', borderRadius: '8px' }} 
                />
                <h2 className="heroTitle">
                  Welcome Back, Admin <ZapOff size={34} style={{ verticalAlign: "middle" }} />
                </h2>
              </div>
              <p className="heroSub">
                You're the <span className="highlight-yellow">spark</span> that keeps
                <span className="highlight-blue"> Vijaya Electronics </span> glowing — empowering teams,
                energizing progress, and leading innovation forward.
              </p>
              
              <button onClick={generatePDFReport} className="pdfButton">
                <Download size={20} />
                Download Dashboard Report (PDF)
              </button>
            </div>

            <div className="clockBox">
              <p className="time">{formatTime(time)}</p>
              <p className="date">{formatDate(time)}</p>
            </div>
          </div>

          {/* Dynamic Statistics Section */}
          <div className="statsSection">
            <h3 style={{ color: '#ffd166', marginBottom: '20px', fontSize: '1.5rem', textAlign: 'center' }}>
              <BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
              System Overview
            </h3>
            
            {dashboardData.loading ? (
              <div style={{ textAlign: 'center', color: '#c9d3e0', padding: '40px' }}>
                Loading dashboard data...
              </div>
            ) : (
              <div className="statsGrid">
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalSuppliers}</div>
                  <div className="statLabel">Total Suppliers</div>
                </div>
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalCustomers}</div>
                  <div className="statLabel">Total Customers</div>
                </div>
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalProducts}</div>
                  <div className="statLabel">Products in Catalog</div>
                </div>
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalOrders}</div>
                  <div className="statLabel">Active Orders</div>
                </div>
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalInvoices}</div>
                  <div className="statLabel">Processed Invoices</div>
                </div>
                <div className="statItem">
                  <div className="statNumber">{dashboardData.totalTickets}</div>
                  <div className="statLabel">Support Tickets</div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ color: '#ffd166', marginBottom: '15px', fontSize: '1.2rem' }}>
                <FileText size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Recent Activity
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} style={{ 
                    padding: '10px', 
                    margin: '5px 0', 
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #ffd166'
                  }}>
                    <div style={{ color: '#ffd166', fontSize: '0.9rem', fontWeight: '600' }}>
                      {activity.type}
                    </div>
                    <div style={{ color: '#c9d3e0', fontSize: '0.85rem', marginTop: '4px' }}>
                      {activity.description}
                    </div>
                    <div style={{ color: '#98a2b3', fontSize: '0.75rem', marginTop: '4px' }}>
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cards">
            <Card
              icon={<Zap size={32} color="#FFD166" />}
              title="Empower"
              text="Each supplier you onboard amplifies Vijaya Electronics' strength — driving reliability and innovation."
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
            © {new Date().getFullYear()} <b>Vijaya Electronics Admin</b> · Crafted with ⚡{" "}
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
