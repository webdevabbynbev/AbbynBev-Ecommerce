import FullLayout from "../layout/FullLayout"
import { FormLogin } from "../components/Forms/Auth/FormLogin"

function LoginPage() {
  return (
    <FullLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 30,
        }}
      >
        <img
          src="/logoAbbyCombine.svg"
          alt="Icon"
          style={{ width: 140, height: "auto" }}
        />
        <div
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "var(--ant-primary-color)",
          }}
        >
        </div>
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        Sign In to your account
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#404040",
          marginBottom: 20,
        }}
      >
        Welcome back! Please sign in with the account you’ve registered
      </div>

      <FormLogin />
    </FullLayout>
  )
}

export default LoginPage
