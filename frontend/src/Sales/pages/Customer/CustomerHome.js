import CustomerHeader from "../../components/Customer/CustomerHeader";
import "../../styles/sales.css";
import "../../styles/customer-dark.css";

const CustomerHome = ({ customerId }) => {
  return (
    <div className="customer-app min-h-screen">
      {/* Header */}
      <CustomerHeader customerId={customerId}/>

      {/* Hero Section */}
      <main className="pt-20">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
            Welcome to Vijaya Electronics
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Your trusted partner for quality electronics and expert repairs
          </p>
          <div className="flex justify-center space-x-4">
            <button className="customer-btn-primary px-8 py-3 rounded-lg font-semibold">
              Shop Now
            </button>
            <button className="customer-btn-secondary px-8 py-3 rounded-lg font-semibold">
              Learn More
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CustomerHome;
