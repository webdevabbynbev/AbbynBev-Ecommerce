import { Plus_Jakarta_Sans, Damion } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Footer, MobileBottomNav } from "../components";
import GoogleProvider from "@/components/googleProvider/googleProvider";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NavbarClientGate } from "@/components/navbar";
import { Toaster } from "sonner";
import GAListener from "@/components/GAListener";

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

/* ✅ GLOBAL SEO (DEFAULT) */
export const metadata = {
  metadataBase: new URL("https://abbynbev.com"),

  title: {
    default:
      "Abby n Bev | Situs Belanja Online Makeup dan Skincare Terbaik Di Indonesia",
    template: "%s | Abby n Bev",
  },

  description:
    "Lebih dari sekedar Beauty Store atau Toko Kosmetik, di Abby n Bev kamu bisa konsultasi gratis bersama AI Beauty Advisor buat tahu jenis kulit, skintone, undertone, biar belanja makeup dan skincare nggak salah pilih",

  openGraph: {
    siteName: "Abby n Bev",
    type: "website",
  },

  keywords: [
    "beauty store",
    "toko kosmetik",
    "beauty advisor",
    "jenis kulit",
    "abby n bev",
    "skintone",
    "undertone",
    "belanja makeup",
    "belanja skincare",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${damion.variable}`}
      suppressHydrationWarning
    >
      <body
        className="flex flex-col min-h-screen font-sans bg-main"
        suppressHydrationWarning
      >
        {/* GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-99NCXMEG24"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-99NCXMEG24', {
              send_page_view: true
            });
          `}
        </Script>
        <GAListener />
        <GoogleProvider>
          <AuthProvider>
            <WishlistProvider>
              <NavbarClientGate />

              <main className="flex-1">
                {children}
                <div className="lg:hidden h-24" />
              </main>

              <Toaster position="top-center" />
              <MobileBottomNav />
              <Footer />
            </WishlistProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
