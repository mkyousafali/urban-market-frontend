// src/components/Dashboard.jsx

import React, { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

// --- Use ر.س as the currency symbol for all amounts ---

const statCards = [
  { label: "Total Receivables", value: "ر.س 12,000" },
  { label: "Received Amount", value: "ر.س 9,000" },
  { label: "Outstanding Receivables", value: "ر.س 3,000" },
  { label: "Total Payables", value: "ر.س 5,000" },
  { label: "Paid Amount", value: "ر.س 4,500" },
  { label: "Outstanding Payables", value: "ر.س 500" },
];

const collectionData = [
  { date: "Jun 01", amount: 1500 },
  { date: "Jun 05", amount: 2000 },
  { date: "Jun 10", amount: 1700 },
  { date: "Jun 20", amount: 3800 },
];

const paymentStatusData = [
  { name: "Paid", value: 9000 },
  { name: "Unpaid", value: 3000 },
];

const unpaidClients = [
  { name: "John Doe", unit: "A101", amount: "ر.س 1,200", due: "2025-07-10", phone: "055-1234567", status: "Overdue" },
  { name: "Fatima Ali", unit: "B305", amount: "ر.س 900", due: "2025-07-12", phone: "055-9988776", status: "Due Soon" },
];

const COLORS = ["#00C49F", "#FF8042"];

function exportDashboardToExcel() {
  // Prepare data
  const stats = statCards.map((stat) => ({
    Metric: stat.label,
    Value: stat.value,
  }));

  const unpaid = unpaidClients.map((c) => ({
    Name: c.name,
    Unit: c.unit,
    Amount: c.amount,
    "Due Date": c.due,
    Status: c.status,
    Phone: c.phone,
  }));

  // Build workbook
  const wb = XLSX.utils.book_new();
  const statsSheet = XLSX.utils.json_to_sheet(stats);
  const unpaidSheet = XLSX.utils.json_to_sheet(unpaid);

  XLSX.utils.book_append_sheet(wb, statsSheet, "Summary");
  XLSX.utils.book_append_sheet(wb, unpaidSheet, "Unpaid Clients");

  XLSX.writeFile(wb, `RealEstate-Dashboard-${Date.now()}.xlsx`);
}

export default function Dashboard() {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold neon-glow mb-2 tracking-wider">
  Real Estate Dashboard
</h1>

        <button
          onClick={exportDashboardToExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-800 transition font-semibold"
        >
          Export as Excel
        </button>
      </div>

      <div className="mb-8">
        <DateRange
          editableDateInputs={true}
          onChange={item => setRange([item.selection])}
          moveRangeOnFirstSelection={false}
          ranges={range}
        />
      </div>

      {/* Stat Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
  {statCards.map((card) => (
    <div
      key={card.label}
      className="stat-card-glass"
    >
      <div className="text-slate-200 text-xs tracking-wide">{card.label}</div>
      <div className="text-2xl font-bold neon-glow">{card.value}</div>
    </div>
  ))}
</div>


      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/10 border-none shadow-xl rounded-2xl p-4 backdrop-blur">
          <div className="text-slate-300 mb-2">Collection Trend</div>
          <BarChart width={320} height={180} data={collectionData}>
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip />
            <Bar dataKey="amount" fill="#00C49F" radius={[8, 8, 0, 0]} />
          </BarChart>
        </div>
        <div className="bg-white/10 border-none shadow-xl rounded-2xl p-4 backdrop-blur">
          <div className="text-slate-300 mb-2">Payment Status</div>
          <PieChart width={200} height={180}>
            <Pie
              data={paymentStatusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label
            >
              {paymentStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Unpaid Clients Table */}
      <div className="bg-white/10 border-none shadow-xl rounded-2xl p-4 backdrop-blur">
        <div className="text-slate-300 mb-2">Unpaid Clients</div>
        <table className="w-full text-white text-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-white/10">
              <th className="p-2">Name</th>
              <th>Unit</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {unpaidClients.map((c) => (
              <tr key={c.name} className="hover:bg-white/5 transition">
                <td className="p-2">{c.name}</td>
                <td>{c.unit}</td>
                <td>{c.amount}</td>
                <td>{c.due}</td>
                <td className={c.status === "Overdue" ? "text-red-400 font-bold" : "text-yellow-300"}>
                  {c.status}
                </td>
                <td>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
