import { Plus_Jakarta_Sans, Damion } from "next/font/google";
import "./globals.css";
import { Footer, MobileBottomNav } from "../components";
import GoogleProvider from "@/components/googleProvider";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NavbarClientGate } from "@/components/navbar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});
const damion = Damion({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-damion",
});

export const metadata = {
  title: "Abby n Bev",
  description: "Toko kecantikan bandung",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${damion.variable}`}
      suppressHydrationWarning
    >
      <body
        className="flex flex-col min-h-screen font-sans bg-[#f7f7f7]"
        suppressHydrationWarning
      >
        <GoogleProvider>
          <AuthProvider>
            <WishlistProvider>
              <NavbarClientGate />

              <main className="flex-1">
                {children}
                <div className="lg:hidden h-24" />
              </main>
              <MobileBottomNav />
              <Footer />
            </WishlistProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
