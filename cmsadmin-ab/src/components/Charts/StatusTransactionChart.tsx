import React, { useCallback, useEffect, useState } from "react";
import { Card, Select, Empty } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import http from "../../api/http";

interface PeriodDatum {
  Date: string;
  Total: number;
}

type PeriodType = "daily" | "monthly";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "white",
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      >
        <p style={{ margin: 0 }}>{`${label}`}</p>
        <p style={{ margin: 0, color: "#1890ff" }}>{`Total: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const StatusTransactionChart: React.FC = () => {
  const [data, setData] = useState<PeriodDatum[]>([]);
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (selectedPeriod: PeriodType) => {
    setLoading(true);
    try {
      const res = await http.get("/v1/admin/transaction-status-period");
      if (res?.data?.serve?.[selectedPeriod]) {
        const chartData: PeriodDatum[] = res.data.serve[selectedPeriod].map((item: any) => ({
          Date:
            selectedPeriod === "daily"
              ? (item.date?.split?.("-")?.[2] ?? item.day ?? item.label)
              : (item.monthName ?? item.label),
          Total: Number(item.total) || 0,
        }));
        setData(chartData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching transaction period:", err);
      setData([]);
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

  return (
    <Card
      title="Status Transaction Period"
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
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                value: "Total Transactions",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="Total" fill="#1890ff" animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="No transaction data available" />
      )}
    </Card>
  );
};

export default StatusTransactionChart;
