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

interface TransactionData {
  Date: string;
  Total: number;
}

type PeriodType = "daily" | "monthly";

const TransactionChart: React.FC = () => {
  const [data, setData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [period, setPeriod] = useState<PeriodType>("daily");

  const fetchData = useCallback(async (selectedPeriod: PeriodType) => {
    setLoading(true);
    try {
      const response = await http.get("/admin/total-transaction-period");
      if (response?.data?.serve) {
        const chartData: TransactionData[] = response.data.serve[selectedPeriod].map(
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
      console.error("Error fetching transaction period:", error);
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
      title="Transaction Period"
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Date"
              label={{
                value: period === "daily" ? "Date" : "Month",
                position: "insideBottom",
                offset: -3,
              }}
            />
            <YAxis
              label={{
                value: "Total Transactions",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip />
            <Bar dataKey="Total" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="No transaction data available" />
      )}
    </Card>
  );
};

export default TransactionChart;
