import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import '../styles/Dashboards.css';

export default function DashboardCustomer(){
  const [stats, setStats] = useState({ orders:0, loyalty:0, inTransit:0 });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async() => {
      try{
        const { data } = await api.get('/customers/me'); // { profile }
        setProfile(data?.profile || null);
        setStats(s => ({
          ...s,
          loyalty: data?.profile?.loyaltyPoints ?? 0
        }));
      }catch(e){ }
    })();
  }, []);

  return (
    <div className="page">
      <h2 className="pageTitle">Customer Dashboard</h2>
      <div className="grid3">
        <StatCard title="Total Orders" value={stats.orders} hint="(sample)" />
        <StatCard title="Loyalty Points" value={stats.loyalty} />
        <StatCard title="In Transit" value={stats.inTransit} hint="(sample)"/>
      </div>

      <section className="panel">
        <h3>My Profile</h3>
        {!profile ? <p className="muted">Loading profile…</p> : (
          <div className="profileGrid">
            <div><b>Name:</b> {profile?.user?.name}</div>
            <div><b>Email:</b> {profile?.user?.email}</div>
            <div><b>Phone:</b> {profile?.phone || '-'}</div>
            <div><b>Address:</b> {[profile?.addressLine1, profile?.addressLine2, profile?.city, profile?.country].filter(Boolean).join(', ') || '-'}</div>
            <div><b>Wholesale Pref:</b> {profile?.wholesalePreferred ? 'Yes':'No'}</div>
            <div><b>Loyalty:</b> {profile?.loyaltyPoints ?? 0}</div>
          </div>
        )}
      </section>
    </div>
  );
}
