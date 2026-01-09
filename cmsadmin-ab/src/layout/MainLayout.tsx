import {
  createElement,
  useEffect,
  useState
} from "react";
import type { ReactNode, FC } from "react";
import { Layout, Menu, Dropdown, Modal, Button, Avatar } from "antd";
import type { MenuProps } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import "./MainLayout.css";
import helper from "../utils/helper";
import http from "../api/http";
import FormChangePassword from "../components/Forms/Auth/FormChangePassword";
import FormProfile from "../components/Forms/Auth/FormProfile";
import MenuAdmin from "./Menu/Admin";
import { useNavigate, useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  height?: string | number;
  overflow?: "auto" | "hidden" | "scroll" | "visible";
}

const getIsMobile = () => window.innerWidth <= 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

const MainLayout: FC<MainLayoutProps> = (props) => {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleProfile, setVisibleProfile] = useState(false);

  const { Header, Sider, Content } = Layout;
  const { children, title, height, overflow } = props;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "/logout") {
      localStorage.removeItem("session");
      navigate("/login", { replace: true });
    } else {
      navigate(e.key);
    }
  };

  return (
    <Layout>
      <Sider
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={isMobile ? 0 : 80}
        breakpoint="lg"
        style={{ overflowY: "auto", height: window.innerHeight }}
      >
        <div className="logo" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <img src={collapsed ? "favicon.png" : "/logoAbby.svg"} alt="Logo" />
          {!collapsed && (
            <div style={{ fontWeight: "bold", textAlign: "left" }}>
              Abby <br />
              <span style={{ fontSize: 10, fontWeight: "normal", color: "#8c8c8c" }}>
                E-Commerce
              </span>
            </div>
          )}
        </div>

        <Menu
          theme="light"
          mode="inline"
          defaultOpenKeys={[
            location.pathname.includes("-product") || location.pathname.includes("product-")
              ? "#product"
              : "",
          ]}
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          items={MenuAdmin(helper.isAuthenticated()?.data?.role)}
        />
      </Sider>

      <Layout
        className="site-layout"
        style={{
          height: height ?? "100%",
          overflowY: overflow ?? "auto",
        }}
      >
        <Header
          className="site-layout-background flex align-center shadow"
          style={{
            padding: 0,
            marginBottom: 20,
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          {createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: "trigger",
            onClick: () => setCollapsed(!collapsed),
          })}

          <span
            style={{
              marginLeft: !isMobile ? 0 : "unset",
              fontSize: !isMobile ? 17 : 15,
              marginRight: 5,
            }}
          >
            {helper.truncString(title ?? "", 30, "...")}
          </span>

          {(collapsed && isMobile) || !isMobile ? (
            <div className="flex align-center" style={{ marginLeft: "auto", marginRight: 20 }}>
              <div className="flex flex-column" style={{ marginRight: 10, gap: 5 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6e6b7b",
                    fontWeight: "bold",
                    textAlign: "right",
                  }}
                >
                  {helper.isAuthenticated()?.data?.name || "John Doe"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    textAlign: "right",
                    color: "var(--ant-primary-color)",
                    fontWeight: "bold",
                  }}
                >
                  {helper.isAuthenticated()?.data?.role_name || "ADMINISTRATOR"}
                </span>
              </div>

              <Dropdown
                menu={{
                  onClick: (e) => {
                    if (e.key === "/logout") {
                      Modal.confirm({
                        title: "Logout",
                        icon: <ExclamationCircleOutlined />,
                        content: "Are you sure want logout?",
                        okText: "Yes",
                        cancelText: "No",
                        okButtonProps: { type: "primary" },
                        onOk: () => {
                          http.post("/auth/logout").then(() => {
                            localStorage.removeItem("session");
                            navigate("/login", { replace: true });
                          });
                        },
                      });
                    } else if (e.key === "/change-password") {
                      setVisiblePassword(true);
                    } else {
                      navigate(e.key);
                    }
                  },
                  items: [
                    {
                      key: "/change-password",
                      icon: <LockOutlined />,
                      label: "Change Password",
                      style: { fontSize: 12 },
                    },
                    {
                      key: "/logout",
                      icon: <LogoutOutlined />,
                      label: "Logout",
                      style: { fontSize: 12, borderTop: "1px solid #f0f0f0" },
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <a href="/#" onClick={(e) => e.preventDefault()}>
                  <Avatar icon={<UserOutlined />} />
                </a>
              </Dropdown>
            </div>
          ) : null}
        </Header>

        <Content
          className="site-layout-background"
          style={{
            minHeight: 280,
            background: "unset",
            position: "relative",
          }}
        >
          {children}
          <div style={{ paddingBottom: 50 }} />
          <div
            style={{
              textAlign: "center",
              color: "#212121",
              fontSize: 12,
              paddingBottom: 20,
            }}
          >
            Copyright &copy;
            {new Date().getFullYear()} CV. Gaya Beauty Utama | All Rights Reserved.
          </div>
        </Content>

        {/* Modal Password */}
        <Modal
          centered
          open={visiblePassword}
          title="Edit Password"
          onCancel={() => setVisiblePassword(false)}
          footer={[<Button key="back" onClick={() => setVisiblePassword(false)}>Cancel</Button>]}
        >
          <FormChangePassword
            handleClose={() => setVisiblePassword(false)}
            email={helper.isAuthenticated()?.data?.email}
            authenticated={true}
          />
        </Modal>

        {/* Modal Profile */}
        <Modal
          centered
          open={visibleProfile}
          title="Edit Profile"
          onCancel={() => setVisibleProfile(false)}
          footer={[<Button key="back" onClick={() => setVisibleProfile(false)}>Cancel</Button>]}
        >
          <FormProfile handleClose={() => setVisibleProfile(false)} />
        </Modal>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
