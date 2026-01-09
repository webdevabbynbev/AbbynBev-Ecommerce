import React, { type ReactNode } from "react";
import { Card } from "antd";
import loginLeft from "../assets/img/login-left.png";
import "./FullLayout.css";

interface FullLayoutProps {
  children: ReactNode;
}

const FullLayout: React.FC<FullLayoutProps> = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left Side */}
      <div className="left-side">
        <div
          style={{
            background: "linear-gradient(112.1deg, #E482B9 11.4%, #9B3C6C 70.2%)",
            width: "100%",
            height: "100%",
            color: "#fff",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold", fontSize: 30, marginBottom: 20 }}>
              Welcome to <br /> Abby n Bev Admin Panel
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: "80%" }}>
              Admin panel e-commerce adalah pusat kontrol bagi pengelola
              untuk mengelola produk, pesanan, pelanggan, dan analisis
              penjualan. Platform ini menyediakan alat lengkap untuk
              mengoptimalkan dan memantau operasional toko online secara efisien.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "left" }}>
            <img
              src={loginLeft}
              alt="Illustration"
              style={{ width: "80%", height: "auto", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            borderRadius: 12,
          }}
          bodyStyle={{ padding: "40px 30px" }}
        >
          {children}
        </Card>
      </div>
    </div>
  );
};

export default FullLayout;
