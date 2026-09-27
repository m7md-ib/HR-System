"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/i18n/provider";

const COLORS = { present: "#12805c", late: "#b54708", absent: "#b42318" };

export function AttendanceTrendChart({ data }: { data: { date: string; present: number; late: number; absent: number }[] }) {
  const { dict } = useI18n();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#898781" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          formatter={(value) =>
            value === "present" ? dict.statuses.attendanceStatus.PRESENT : value === "late" ? dict.statuses.attendanceStatus.LATE : dict.statuses.attendanceStatus.ABSENT
          }
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="present" stackId="a" fill={COLORS.present} radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" stackId="a" fill={COLORS.late} />
        <Bar dataKey="absent" stackId="a" fill={COLORS.absent} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
