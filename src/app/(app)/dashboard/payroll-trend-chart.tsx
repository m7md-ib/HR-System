"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PayrollTrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }}
          formatter={(value) => [`${Number(value).toFixed(2)} JOD`, "Net Payroll"]}
        />
        <Line type="monotone" dataKey="total" stroke="#2a78d6" strokeWidth={2} dot={{ r: 4, fill: "#2a78d6" }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
