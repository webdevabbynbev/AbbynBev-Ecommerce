import React, { useState, useCallback, useEffect } from "react";
import { Card, Select, Empty } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import http from "../../api/http";

interface RegisterData {
  Date: string;
  Total: number;
}

type PeriodType = "daily" | "monthly";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const RegisterUserPeriodChart: React.FC = () => {
  const [data, setData] = useState<RegisterData[]>([]);
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (selectedPeriod: PeriodType) => {
    setLoading(true);
    try {
      const response = await http.get("/admin/total-register-user-period");
      if (response?.data?.serve) {
        const chartData: RegisterData[] = response.data.serve[selectedPeriod].map(
          (item: any) => ({
            Date:
              selectedPeriod === "daily"
                ? item.date.split("-")[2]
                : item.monthName,
            Total: item.total,
          })
        );
        setData(chartData);
      }
    } catch (error) {
      console.error("Error fetching register user period:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    fetchData(value);
  };

  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: 0 }}>
            {`${period === "daily" ? "Date" : "Month"}: ${label}`}
          </p>
          <p style={{ margin: 0, color: "#1890ff" }}>
            {`Total: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Register User Period"
      extra={
        <Select<PeriodType>
          value={period}
          style={{ width: 220 }}
          onChange={handlePeriodChange}
          options={[
            { value: "daily", label: "Daily (Current Month)" },
            { value: "monthly", label: "Monthly (Current Year)" },
          ]}
        />
      }
      loading={loading}
    >
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Date"
              label={{
                value: period === "daily" ? "Day" : "Month",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              label={{
                value: "Total Users",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Total"
              fill="#1890ff"
              animationDuration={1500}
              animationBegin={0}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="No register user data available" />
      )}
    </Card>
  );
};

export default RegisterUserPeriodChart;
