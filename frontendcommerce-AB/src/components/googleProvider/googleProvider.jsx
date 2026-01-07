"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({ children }) {
  const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!cid) {
    console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }
  return <GoogleOAuthProvider clientId={cid || ""}>{children}</GoogleOAuthProvider>;
}