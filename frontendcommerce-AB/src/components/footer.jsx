"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from ".";
import { FaTiktok, FaInstagram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Top */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Logo */}
          <div className="lg:col-span-3">
            <Link href="/" aria-label="Home">
              <Image
                src="/Logoabby-text.svg"
                alt="Logo"
                width={200}
                height={80}
                className="h-[64px] w-[200]"
                priority
              />
            </Link>
          </div>

          {/* Content */}
          <div className="lg:col-span-9">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* About */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-neutral-950">
                  About us
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      About abby n bev
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Terms and condition
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Privacy policy
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Contact us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-neutral-950">
                  Services
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Delivery
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Our store
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      FaQ
                    </Link>
                  </li>
                  <li>
                    <Link className="hover:text-neutral-950" href="#">
                      Customer service
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Community */}
              <div className="space-y-3 lg:pr-4">
                <h3 className="font-semibold text-lg text-neutral-950">
                  Join Abeauty squad
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Connect with fellow beauty lovers, share tips, stay on trend,
                  and grow together in a supportive community.
                </p>
                <Button variant="secondary" size="md">
                  Join ABeauties
                </Button>
              </div>

              {/* Social */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-neutral-950">
                  Our social media
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>
                    <Link
                      href="#"
                      className="inline-flex items-center gap-2 hover:text-neutral-950"
                    >
                      <FaTiktok className="h-4 w-4" />
                      Tiktok
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="inline-flex items-center gap-2 hover:text-neutral-950"
                    >
                      <FaInstagram className="h-4 w-4" />
                      Instagram
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t pt-6 text-center text-xs text-neutral-400">
          © 2025 CV. Gaya Beauty Utama, All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}