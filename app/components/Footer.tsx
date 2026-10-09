"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Facebook, Youtube, Linkedin, Instagram } from "lucide-react";
import LogoImg from "@/public/assets/images/logo-dark-bg.png";
import Image from "next/image";

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // floating particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = 320);
    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      v: Math.random() * 0.3 + 0.1,
    }));
    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      particles.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) p.y = h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }, []);

  function subscribe() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setToast(valid ? "Subscribed successfully!" : "Please enter a valid email");
    setTimeout(() => setToast(null), 2500);
    if (valid) setEmail("");
  }

  const linkClass =
    "relative w-fit text-white/80 hover:text-white transition after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-white after:transition-all hover:after:w-full";

  return (
    <footer className="relative bg-[#16563a] text-white pt-16 pb-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-20 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-10 text-sm">
          <div className="footer-col space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <Image
                src={LogoImg}
                alt="Logo"
                className="w-8 h-8 md:w-10 md:h-10 rounded"
              />
              <span className="text-base font-semibold text-white whitespace-nowrap">
                Care Licensing Solutions
              </span>
            </div>
            <p className="text-white/80 leading-relaxed">
              Launch Your Care Business with Confidence. State-specific
              licensing packages and compliance resources trusted nationwide.
            </p>
            <div className="flex gap-3 pt-2">
              {[Facebook, Youtube, Linkedin, Instagram].map((Icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Icon size={16} />
                </div>
              ))}
            </div>
          </div>

          <div className="footer-col space-y-3">
            <h4 className="font-semibold text-base">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Shop", href: "/shop" },
                { label: "Browse by State", href: "/states" },
                { label: "Bundles", href: "/bundles" },
                { label: "Course", href: "/course" },
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.label} className={linkClass}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col space-y-3">
            <h4 className="font-semibold text-base">Legal</h4>
            <ul className="space-y-2">
              <li className={linkClass}>Terms of Service</li>
              <li className={linkClass}>Privacy Policy</li>
            </ul>
          </div>

          <div className="footer-col space-y-4">
            <h4 className="font-semibold text-base">Stay Updated</h4>
            <p className="text-white/80">
              Get licensing tips and updates delivered to your inbox.
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#f0b23a]"
            />
            <button
              onClick={subscribe}
              className="w-full relative overflow-hidden bg-[#f0b23a] text-[#1c3b2b] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition active:scale-[0.98] hover:shadow-[0_0_25px_rgba(240,178,58,0.6)]"
            >
              <Mail size={16} /> Subscribe
            </button>
          </div>
        </div>

        <div className="h-px bg-white/20 my-10" />

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white/70 text-xs">
          <p>© 2026 Care Licensing Solutions. All Rights Reserved.</p>
          {/* <div className="flex gap-4 opacity-80">
            <svg width="46" height="16" viewBox="0 0 46 16" fill="currentColor">
              <rect width="46" height="16" rx="3" />
            </svg>
            <svg width="46" height="16" viewBox="0 0 46 16" fill="currentColor">
              <circle cx="23" cy="8" r="7" />
            </svg>
            <svg width="46" height="16" viewBox="0 0 46 16" fill="currentColor">
              <path d="M0 0h46v16H0z" />
            </svg>
            <svg width="46" height="16" viewBox="0 0 46 16" fill="currentColor">
              <rect x="10" y="2" width="26" height="12" rx="2" />
            </svg>
          </div> */}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-3 rounded-xl shadow-lg text-sm animate-[fadeIn_.3s_ease]">
          {toast}
        </div>
      )}
    </footer>
  );
}
