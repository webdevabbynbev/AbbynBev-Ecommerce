import React from "react"
import FullLayout from "../layout/FullLayout"
import { FormForgot } from "../components/Forms/Auth/FormForgot"

const ForgotPage: React.FC = () => {
  return (
    <FullLayout>
      {/* Logo & Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <img src="/logoAbbyCombine.svg" alt="Icon" style={{ width: 140, height: "auto" }} />
        <div
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "var(--ant-primary-color)",
          }}
        >
        </div>
      </div>

      {/* Heading */}
      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        Forgot Password
      </div>

      {/* Subheading */}
      <div
        style={{
          fontSize: 12,
          color: "#404040",
          marginBottom: 20,
        }}
      >
        Please fill in your registered email to send a password update link.
        <br />
        Back to login{" "}
        <a style={{ fontWeight: "bold" }} href="/login">
          here
        </a>
        .
      </div>

      {/* Form */}
      <FormForgot />
    </FullLayout>
  )
}

export default ForgotPage
