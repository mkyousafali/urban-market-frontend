import React, { useState } from "react";
import ReceivablePartialPaymentForm from "../ReceivablePartialPaymentForm";
import { supabase } from "../../supabaseClient";

function ContractsList({
  contracts,
  properties,
  units,
  clients,
  loadingContracts,
  onEditContract,
  onDeleteContract,
}) {
  const [openContractId, setOpenContractId] = useState(null); // For contract details
  const [rentScheduleOpenId, setRentScheduleOpenId] = useState(null); // For rent schedule table
  const [rentReceivables, setRentReceivables] = useState({});
  const [loadingRent, setLoadingRent] = useState(false);

  // Fetch rent receivables for a contract
  const showRentSchedule = async (contractId) => {
    setLoadingRent(true);
    setRentScheduleOpenId(contractId);
    const { data, error } = await supabase
      .from("rent_receivables")
      .select("*")
      .eq("contract_id", contractId)
      .order("due_date", { ascending: true });
    setRentReceivables((prev) => ({ ...prev, [contractId]: data || [] }));
    setLoadingRent(false);
  };

  const handleHideSchedule = () => {
    setRentScheduleOpenId(null);
  };

  const handleReceivablePartialPayment = async (r, addAmount) => {
    const newPaid = (Number(r.amount_paid) || 0) + addAmount;
    const newStatus = newPaid >= Number(r.amount_due) ? "paid" : "partial";
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('rent_receivables')
      .update({
        amount_paid: newPaid,
        status: newStatus,
        paid_at: today
      })
      .eq('id', r.id);
    if (!error) showRentSchedule(r.contract_id);
    else alert("Error updating payment: " + error.message);
  };

  const undoPaidRentReceivable = async (rentId, contractId) => {
    const { error } = await supabase
      .from('rent_receivables')
      .update({ status: 'pending', paid_at: null, paid_date: null, amount_paid: 0 })
      .eq('id', rentId);
    if (error) {
      alert('Error undoing paid: ' + error.message);
    } else {
      showRentSchedule(contractId);
    }
  };

  return (
    <div>
      <h4>All Contracts</h4>
      {loadingContracts && <p>Loading contracts...</p>}
      {!loadingContracts && contracts.length === 0 && <p>No contracts found.</p>}
      <ul>
        {contracts.map((ctr) => (
          <li key={ctr.id} className="list-card">
            <strong>
              {clients.find(c => c.id === ctr.client_id)?.client_name || "Client"} renting {units.find(u => u.id === ctr.unit_id)?.unit_name || "Unit"} in {properties.find(p => p.id === ctr.property_id)?.property_name || "Property"}
            </strong>
            <button
              style={{
                marginLeft: 12,
                background: openContractId === ctr.id ? "#444" : "#0cf",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                padding: "2px 8px",
                cursor: "pointer",
              }}
              onClick={() =>
                setOpenContractId(openContractId === ctr.id ? null : ctr.id)
              }
            >
              {openContractId === ctr.id ? "Hide Details" : "Show Details"}
            </button>
            <button
              style={{
                marginLeft: 8,
                background: rentScheduleOpenId === ctr.id ? "#444" : "#00cc99",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                padding: "2px 8px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (rentScheduleOpenId === ctr.id) {
                  handleHideSchedule();
                } else {
                  showRentSchedule(ctr.id);
                }
              }}
            >
              {rentScheduleOpenId === ctr.id ? "Hide Rent Schedule" : "Show Rent Schedule"}
            </button>
            {openContractId === ctr.id && (
              <div style={{ marginLeft: 16, marginTop: 8 }}>
                {ctr.contract_start} to {ctr.contract_end} | {ctr.payment_frequency} | Rent: {ctr.rent_amount}
                <br />
                Security Deposit: {ctr.security_deposit}
                <br />
                <button
                  style={{ marginTop: 4, marginRight: 8 }}
                  onClick={() => onEditContract(ctr)}
                >
                  Edit
                </button>
                <button
                  style={{
                    marginTop: 4,
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 3,
                  }}
                  onClick={() => onDeleteContract(ctr.id)}
                >
                  Delete
                </button>
              </div>
            )}
            {/* Rent Receivables Table, only for this contract */}
            {rentScheduleOpenId === ctr.id && (
              <div style={{ marginTop: 8, marginLeft: 16 }}>
                <h5>Rent Payment Schedule</h5>
                {loadingRent && <p>Loading schedule...</p>}
                {!loadingRent && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Paid</th>
                        <th>Actions</th>
                        <th>Undo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rentReceivables[ctr.id] || []).map(r => (
                        <tr key={r.id}>
                          <td>{r.due_date}</td>
                          <td>{r.amount_due}</td>
                          <td>{r.status}</td>
                          <td>{r.amount_paid || 0}</td>
                          <td>
                            {r.status !== "paid" && (
                              <ReceivablePartialPaymentForm
                                payment={r}
                                onPay={amt => handleReceivablePartialPayment(r, amt)}
                              />
                            )}
                          </td>
                          <td>
                            {r.status === "paid" && (
                              <button onClick={() => undoPaidRentReceivable(r.id, ctr.id)}>
                                Undo
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContractsList;
