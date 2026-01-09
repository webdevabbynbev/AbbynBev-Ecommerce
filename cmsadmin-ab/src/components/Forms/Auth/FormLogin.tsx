import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Form, Input, Button } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import api from "../../../api/http"

interface LoginValues {
  email: string
  password: string
}

export function FormLogin() {
  const [form] = Form.useForm<LoginValues>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: LoginValues) => {
    try {
      setLoading(true)
      const res = await api.post("/auth/login-admin", values)
      if (res && (res.data?.serve || res.data?.token)) {
        const sessionData = res.data.serve || res.data
        localStorage.setItem("session", JSON.stringify(sessionData))
        navigate("/dashboard", { replace: true })
      }
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: unknown) => {
    console.error("Failed:", errorInfo)
  }

  return (
    <Form<LoginValues>
      autoComplete="off"
      form={form}
      name="basic"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Email required" },
          { type: "email", message: "Email not valid" },
        ]}
      >
        <Input placeholder="Enter your email" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Password required." }]}
      >
        <Input.Password
          placeholder="Enter your password"
          autoComplete="new-password"
        />
      </Form.Item>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button type="primary" htmlType="submit" loading={loading}>
          Sign In <ArrowRightOutlined />
        </Button>
        <Button type="link" href="/forgot">
          Forgot password?
        </Button>
      </div>
    </Form>
  )
}
