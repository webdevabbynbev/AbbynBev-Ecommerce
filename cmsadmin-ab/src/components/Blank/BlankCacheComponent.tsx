import Result from "antd/es/result"
import { LoadingOutlined } from "@ant-design/icons"
import {useEffect } from "react"
import type { FC } from "react"

interface BlankCacheComponentProps {
  emptyCacheStorage: () => void
  isLatestVersion: boolean
}

const BlankCacheComponent: FC<BlankCacheComponentProps> = ({
  emptyCacheStorage,
  isLatestVersion,
}) => {
  useEffect(() => {
    if (!isLatestVersion) {
      emptyCacheStorage()
    }
  }, [isLatestVersion])

  return (
    <Result
      icon={
        <img src={`/logo.png`} alt="Logo OmniX Panel" style={{ width: 250 }} />
      }
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        height: "100%",
      }}
      title={
        <div className="oxanium" style={{ fontWeight: "bold", fontSize: 14 }}>
          Browser verification before entering the website.
        </div>
      }
      subTitle={
        <div className="opensans" style={{ fontSize: 12 }}>
          The browser will automatically redirect to the main page once the
          process is complete.
        </div>
      }
      extra={[
        <LoadingOutlined
          key={"loading"}
          style={{
            fontSize: 24,
          }}
          spin
        />,
      ]}
    />
  )
}

export default BlankCacheComponent
