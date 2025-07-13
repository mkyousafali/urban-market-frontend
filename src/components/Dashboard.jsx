import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stats, setStats] = useState({
    lease: { due: 0, paid: 0, outstanding: 0 },
    rent: { due: 0, paid: 0, outstanding: 0 }
  });
  const [currentMonthStats, setCurrentMonthStats] = useState({
    lease: { due: 0, paid: 0, outstanding: 0 },
    rent: { due: 0, paid: 0, outstanding: 0 }
  });
  const [detailModal, setDetailModal] = useState({
    open: false, title: "", records: [], type: "",
    contractMap: {}, clientNames: {}, propertyNames: {}, unitNames: {}
  });

  const isValid = from && to && new Date(from) <= new Date(to);

  // Get current month first/last day
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  // Next month first day:
  const lastDay = `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-01`;

  // Fetch date-range stats
  useEffect(() => {
    if (!isValid) return;
    async function fetchStats() {
      let { data: lease_payments } = await supabase
        .from("lease_payments").select("*").gte("due_date", from).lte("due_date", to);

      let lease_due = 0, lease_paid = 0, lease_outstanding = 0;
      if (lease_payments) {
        lease_due = lease_payments.reduce((sum, p) => sum + Number(p.amount_due || 0), 0);
        lease_paid = lease_payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        lease_outstanding = lease_payments.reduce(
          (sum, p) => sum + (Number(p.amount_due || 0) - Number(p.amount_paid || 0)), 0
        );
      }

      let { data: rent_receivables } = await supabase
        .from("rent_receivables").select("*").gte("due_date", from).lte("due_date", to);

      let rent_due = 0, rent_paid = 0, rent_outstanding = 0;
      if (rent_receivables) {
        rent_due = rent_receivables.reduce((sum, p) => sum + Number(p.amount_due || 0), 0);
        rent_paid = rent_receivables.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        rent_outstanding = rent_receivables.reduce(
          (sum, p) => sum + (Number(p.amount_due || 0) - Number(p.amount_paid || 0)), 0
        );
      }

      setStats({
        lease: { due: lease_due, paid: lease_paid, outstanding: lease_outstanding },
        rent: { due: rent_due, paid: rent_paid, outstanding: rent_outstanding }
      });
    }
    fetchStats();
  }, [from, to, isValid]);

  // Fetch current month stats
  useEffect(() => {
    async function fetchMonthStats() {
      let { data: lease_payments } = await supabase
        .from("lease_payments").select("*").gte("due_date", firstDay).lt("due_date", lastDay);

      let lease_due = 0, lease_paid = 0, lease_outstanding = 0;
      if (lease_payments) {
        lease_due = lease_payments.reduce((sum, p) => sum + Number(p.amount_due || 0), 0);
        lease_paid = lease_payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        lease_outstanding = lease_payments.reduce(
          (sum, p) => sum + (Number(p.amount_due || 0) - Number(p.amount_paid || 0)), 0
        );
      }

      let { data: rent_receivables } = await supabase
        .from("rent_receivables").select("*").gte("due_date", firstDay).lt("due_date", lastDay);

      let rent_due = 0, rent_paid = 0, rent_outstanding = 0;
      if (rent_receivables) {
        rent_due = rent_receivables.reduce((sum, p) => sum + Number(p.amount_due || 0), 0);
        rent_paid = rent_receivables.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        rent_outstanding = rent_receivables.reduce(
          (sum, p) => sum + (Number(p.amount_due || 0) - Number(p.amount_paid || 0)), 0
        );
      }

      setCurrentMonthStats({
        lease: { due: lease_due, paid: lease_paid, outstanding: lease_outstanding },
        rent: { due: rent_due, paid: rent_paid, outstanding: rent_outstanding }
      });
    }
    fetchMonthStats();
  }, [firstDay, lastDay]);
  // --- Stat Cards Array ---
  const statCards = [
    { label: "Total Lease Payable", value: `ر.س ${stats.lease.due.toLocaleString()}`, type: "lease_due" },
    { label: "Lease Paid Amount", value: `ر.س ${stats.lease.paid.toLocaleString()}`, type: "lease_paid" },
    { label: "Outstanding Lease Payables", value: `ر.س ${stats.lease.outstanding.toLocaleString()}`, highlight: true, type: "lease_outstanding" },
    { label: "Total Rent Receivables", value: `ر.س ${stats.rent.due.toLocaleString()}`, type: "rent_due" },
    { label: "Rent Received Amount", value: `ر.س ${stats.rent.paid.toLocaleString()}`, type: "rent_paid" },
    { label: "Outstanding Rent Receivables", value: `ر.س ${stats.rent.outstanding.toLocaleString()}`, highlight: true, type: "rent_outstanding" }
  ];

  // --- Current Month Card Array ---
  const monthCards = [
    { label: "Lease Payable (This Month)", value: `ر.س ${currentMonthStats.lease.due.toLocaleString()}`, type: "lease_due_month" },
    { label: "Lease Paid (This Month)", value: `ر.س ${currentMonthStats.lease.paid.toLocaleString()}`, type: "lease_paid_month" },
    { label: "Outstanding Lease Payables (This Month)", value: `ر.س ${currentMonthStats.lease.outstanding.toLocaleString()}`, highlight: true, type: "lease_outstanding_month" },
    { label: "Rent Receivables (This Month)", value: `ر.س ${currentMonthStats.rent.due.toLocaleString()}`, type: "rent_due_month" },
    { label: "Rent Received (This Month)", value: `ر.س ${currentMonthStats.rent.paid.toLocaleString()}`, type: "rent_paid_month" },
    { label: "Outstanding Rent Receivables (This Month)", value: `ر.س ${currentMonthStats.rent.outstanding.toLocaleString()}`, highlight: true, type: "rent_outstanding_month" }
  ];

  // --- Card Click Handler (Works for All Cards) ---
  async function handleCardClick(type) {
    let records = [];
    let title = "";
    let table = "";
    let contractMap = {};
    let clientNames = {}, propertyNames = {}, unitNames = {};
    let fromDate, toDate;

    if (type.endsWith("_month")) {
      fromDate = firstDay;
      toDate = lastDay;
    } else {
      fromDate = from;
      toDate = to;
    }

    if (type.startsWith("lease")) {
      table = "lease_payments";
      let { data } = await supabase.from(table).select("*").gte("due_date", fromDate).lt("due_date", toDate);
      if (type === "lease_due" || type === "lease_due_month") {
        records = data || [];
        title = type.endsWith("_month") ? "All Lease Payables (This Month)" : "All Lease Payables";
      } else if (type === "lease_paid" || type === "lease_paid_month") {
        records = (data || []).filter(r => Number(r.amount_paid || 0) > 0);
        title = type.endsWith("_month") ? "Lease Payments Received (This Month)" : "Lease Payments Received";
      } else if (type === "lease_outstanding" || type === "lease_outstanding_month") {
        records = (data || []).filter(r => Number(r.amount_due || 0) > Number(r.amount_paid || 0));
        title = type.endsWith("_month") ? "Outstanding Lease Payables (This Month)" : "Outstanding Lease Payables";
      }
      var propertyIds = [...new Set(records.map(r => r.property_id).filter(Boolean))];
      if (propertyIds.length) {
        let { data: props } = await supabase.from("properties").select("id, property_name").in("id", propertyIds);
        if (props) props.forEach(p => { propertyNames[p.id] = p.property_name; });
      }
    } else if (type.startsWith("rent")) {
      table = "rent_receivables";
      let { data } = await supabase.from(table).select("*").gte("due_date", fromDate).lt("due_date", toDate);
      if (type === "rent_due" || type === "rent_due_month") {
        records = data || [];
        title = type.endsWith("_month") ? "All Rent Receivables (This Month)" : "All Rent Receivables";
      } else if (type === "rent_paid" || type === "rent_paid_month") {
        records = (data || []).filter(r => Number(r.amount_paid || 0) > 0);
        title = type.endsWith("_month") ? "Rent Payments Received (This Month)" : "Rent Payments Received";
      } else if (type === "rent_outstanding" || type === "rent_outstanding_month") {
        records = (data || []).filter(r => Number(r.amount_due || 0) > Number(r.amount_paid || 0));
        title = type.endsWith("_month") ? "Outstanding Rent Receivables (This Month)" : "Outstanding Rent Receivables";
      }
      const contractIds = [...new Set(records.map(r => r.contract_id).filter(Boolean))];
      let contracts = [];
      if (contractIds.length) {
        let { data: ctrs } = await supabase.from("contracts")
          .select("id, client_id, property_id, unit_id")
          .in("id", contractIds);
        contracts = ctrs || [];
      }
      contractMap = {};
      contracts.forEach(c => { contractMap[c.id] = c; });
      var clientIds = [...new Set(contracts.map(c => c.client_id).filter(Boolean))];
      var propertyIds = [...new Set(contracts.map(c => c.property_id).filter(Boolean))];
      var unitIds = [...new Set(contracts.map(c => c.unit_id).filter(Boolean))];
      if (clientIds.length) {
        let { data: clients } = await supabase.from("clients").select("id, client_name").in("id", clientIds);
        if (clients) clients.forEach(c => { clientNames[c.id] = c.client_name; });
      }
      if (propertyIds.length) {
        let { data: props } = await supabase.from("properties").select("id, property_name").in("id", propertyIds);
        if (props) props.forEach(p => { propertyNames[p.id] = p.property_name; });
      }
      if (unitIds.length) {
        let { data: units } = await supabase.from("units").select("id, unit_name").in("id", unitIds);
        if (units) units.forEach(u => { unitNames[u.id] = u.unit_name; });
      }
    }

    setDetailModal({
      open: true,
      title,
      records,
      type,
      contractMap,
      clientNames,
      propertyNames,
      unitNames
    });
  }

  // --- Start Render ---
  return (
    <div className="w-full min-h-screen bg-[#f7faff] py-12" style={{ fontFamily: "Segoe UI, Roboto, Arial, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-700">Welcome, User</div>
            <div className="text-3xl font-bold text-slate-800 mb-1">Real Estate Dashboard</div>
          </div>
          <div className="flex gap-2">
            <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
              <span>From</span>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-sm"
                max={to || undefined}
              />
            </label>
            <label className="text-slate-700 text-sm font-medium flex items-center gap-1">
              <span>To</span>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-sm"
                min={from || undefined}
              />
            </label>
          </div>
        </div>

        {/* Current Month Cards */}
        <div className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {monthCards.map(card => (
              <div
                key={card.label}
                className={`bg-white rounded-xl shadow-md px-6 py-5 flex flex-col items-start min-w-[120px] max-w-[210px] border border-slate-100 transition 
                  ${card.highlight ? "border-orange-400" : ""}
                `}
                style={{ cursor: "pointer" }}
                onClick={() => handleCardClick(card.type)}
                title="Click for detail"
              >
                <span className="text-xs text-blue-600 mb-2 font-semibold">{card.label}</span>
                <span className={`text-2xl font-extrabold ${card.highlight ? "text-orange-500" : "text-slate-900"}`}>
                  {card.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards for Date Range */}
        {!isValid ? (
          <div className="bg-white rounded-xl text-slate-400 py-16 text-center text-lg font-semibold shadow mb-10">
            Please select a valid date range to view the dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mb-12">
            {statCards.map(card => (
              <div
                key={card.label}
                className={`bg-white rounded-xl shadow-md px-6 py-5 flex flex-col items-start min-w-[120px] max-w-[210px] border border-slate-100 transition 
                  ${card.highlight ? "border-orange-400" : ""}
                `}
                style={{ cursor: "pointer" }}
                onClick={() => handleCardClick(card.type)}
                title="Click for detail"
              >
                <span className="text-xs text-slate-600 mb-2 font-semibold">{card.label}</span>
                <span className={`text-2xl font-extrabold ${card.highlight ? "text-orange-500" : "text-slate-900"}`}>
                  {card.value}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Detail Modal */}
        {detailModal.open && (
          <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full shadow-lg overflow-auto" style={{ maxHeight: "90vh" }}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-slate-800">{detailModal.title}</h2>
                <button
                  className="text-lg px-2 py-1 bg-slate-200 rounded hover:bg-slate-300"
                  onClick={() => setDetailModal({
                    open: false, title: "", records: [], type: "",
                    contractMap: {}, clientNames: {}, propertyNames: {}, unitNames: {}
                  })}
                >
                  ×
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-800 border-b">
                      <th>Client</th>
                      <th>Property</th>
                      <th>Unit</th>
                      <th>Amount Due</th>
                      <th>Amount Paid</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.records.map(rec => {
                      let client = "-", property = "-", unit = "-";
                      if (detailModal.type.startsWith("lease")) {
                        property = detailModal.propertyNames?.[rec.property_id] || "-";
                      } else if (detailModal.type.startsWith("rent")) {
                        const ctr = detailModal.contractMap?.[rec.contract_id];
                        client = detailModal.clientNames?.[ctr?.client_id] || "-";
                        property = detailModal.propertyNames?.[ctr?.property_id] || "-";
                        unit = detailModal.unitNames?.[ctr?.unit_id] || "-";
                      }
                      return (
                        <tr key={rec.id} className="border-b hover:bg-slate-50">
                          <td>{client}</td>
                          <td>{property}</td>
                          <td>{unit}</td>
                          <td>{rec.amount_due}</td>
                          <td>{rec.amount_paid}</td>
                          <td>{rec.due_date}</td>
                          <td>{rec.status}</td>
                          <td>{rec.payment_note || ""}</td>
                        </tr>
                      );
                    })}
                    {detailModal.records.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-slate-400 py-4">No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
