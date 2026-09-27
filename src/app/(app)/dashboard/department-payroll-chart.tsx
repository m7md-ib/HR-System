"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DepartmentPayrollChart({ data }: { data: { name: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }}
          formatter={(value) => [`${Number(value).toFixed(2)} JOD`, "Net Payroll"]}
        />
        <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
