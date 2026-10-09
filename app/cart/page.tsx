import CartClient from "../components/CartClient";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function CartPage() {
  return (
    <>
      <Header />
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 pb-10 pt-24">
          <nav className="text-sm text-gray-500 mb-6">
            <a href="/">Home</a> / <span>Cart</span>
          </nav>
          <h1 className="text-3xl font-bold mb-8 text-black">Shopping Cart</h1>
          <CartClient />
        </div>
      </section>
      <Footer />
    </>
  );
}
