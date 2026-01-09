import { Form, Input, Button } from "antd"
import { ArrowRightOutlined } from "@ant-design/icons"
import type { FormInstance } from "antd/es/form"
import http from "../../../api/http"

interface ForgotValues {
  email: string
}

export function FormForgot() {
  const [form] = Form.useForm<ForgotValues>()

  const onFinish = async (values: ForgotValues) => {
    try {
      const res = await http.post("/auth/forgot", values)
      if (res) {
        await form.resetFields()
      }
    } catch (error) {
      console.error("Forgot password failed:", error)
    }
  }

  const onFinishFailed = (errorInfo: unknown) => {
    console.error("Failed:", errorInfo)
  }

  return (
    <Form<ForgotValues>
      autoComplete="off"
      form={form as FormInstance<ForgotValues>}
      name="forgot"
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item<ForgotValues>
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Email required." },
          { type: "email", message: "Email not valid" },
        ]}
      >
        <Input placeholder="Input email here" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Send link <ArrowRightOutlined />
        </Button>
      </Form.Item>
    </Form>
  )
}
