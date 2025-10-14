import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ElectricBulb from '../components/ElectricBulb';
import InfoRail from '../components/InfoRail';            // <-- NEW
import '../styles/CustomerHome.css';

export default function CustomerHome(){
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if(user){
      const target = user.role === 'admin' ? '/admin' : user.role === 'supplier' ? '/supplier' : '/';
      nav(target, { replace: true });
    }
  }, [user, nav]);

  return (
    <main className="homeWrap">
      <section className="hero heroGrid">
        <div className="hero-inner">
          <h1>Power your day with Electra</h1>
          
        <p>Shop trusted electrical brands with seamless ordering, live order tracking, 24–48h dispatch, PCI-secure payments, loyalty rewards, and up to 2-year warranty.</p>


          <a href="/" className="ctaBtn">Explore</a>
        </div>

        {/* NEW: middle info rail */}
        <InfoRail />

        <div className="hero-art">
          <ElectricBulb />
        </div>

        {/* pulses */}
        <div className="pulsePanel" aria-hidden="true">
          <div className="pulseGrid">
            <span className="pulseLine"></span>
            <span className="pulseLine"></span>
            <span className="pulseLine"></span>
            <span className="pulseLine"></span>
            <span className="pulseLine"></span>
          </div>
        </div>
      </section>
    </main>
  );
}
