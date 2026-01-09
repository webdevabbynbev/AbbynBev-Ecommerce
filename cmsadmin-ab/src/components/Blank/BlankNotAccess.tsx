import type { FC } from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

const BlankNotAccess: FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you cannot access this page."
      extra={
        <Button type="primary" onClick={() => navigate(-1)}>
          Back
        </Button>
      }
    />
  );
};

export default BlankNotAccess;
