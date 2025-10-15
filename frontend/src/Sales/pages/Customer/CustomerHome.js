import CustomerHeader from "../../components/Customer/CustomerHeader";
import "../../styles/sales.css";

const CustomerHome = ({ customerId }) => {
  return (
    <div className="min-h-screen bg-light-gray">
      {/* Header */}
      <CustomerHeader customerId={customerId}/>

      {/* Hero Section */}
      <main className="pt-20">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-electric-blue bg-clip-text">
            Welcome to Vijaya Electronics
          </h1>
          <p className="text-lg md:text-xl text-slate-gray mb-8">
            Your trusted partner for quality electronics and expert repairs
          </p>
        </section>
      </main>
    </div>
  );
};

export default CustomerHome;
