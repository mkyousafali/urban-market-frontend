import React, { useState } from "react";
import LeasePartialPaymentForm from "../LeasePartialPaymentForm";
import { supabase } from "../../supabaseClient";

function PropertiesList({
  properties,
  loading,
  expandedPropertyId,
  onExpandProperty,
  onEditProperty,
  onDeleteProperty,
  renderUnitsForProperty,
  t = txt => txt
}) {
  const [leaseScheduleOpenId, setLeaseScheduleOpenId] = useState(null);
  const [leasePayments, setLeasePayments] = useState({});
  const [loadingLease, setLoadingLease] = useState(false);

  // Fetch lease payments for a property
  const showLeaseSchedule = async (propertyId) => {
    setLoadingLease(true);
    setLeaseScheduleOpenId(propertyId);
    const { data, error } = await supabase
      .from("lease_payments")
      .select("*")
      .eq("property_id", propertyId)
      .order("due_date", { ascending: true });
    setLeasePayments((prev) => ({ ...prev, [propertyId]: data || [] }));
    setLoadingLease(false);
  };

  const handleHideSchedule = () => {
    setLeaseScheduleOpenId(null);
  };

  // Handle payment registration for lease
  const handleLeasePartialPayment = async (lp, addAmount) => {
    const newPaid = (Number(lp.amount_paid) || 0) + addAmount;
    const newStatus = newPaid >= Number(lp.amount_due) ? "paid" : "partial";
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('lease_payments')
      .update({
        amount_paid: newPaid,
        status: newStatus,
        paid_at: today
      })
      .eq('id', lp.id);
    if (!error) showLeaseSchedule(lp.property_id);
    else alert("Error updating payment: " + error.message);
  };

  return (
    <div>
      <h4>{t('all_properties', 'All Properties')}</h4>
      {loading && <p>{t('loading_properties', 'Loading properties...')}</p>}
      {!loading && properties.length === 0 && <p>{t('no_properties_found', 'No properties found.')}</p>}
      <ul>
        {properties.map((p) => (
          <li key={p.id} className="list-card">
            <strong>{p.property_name}</strong>
            {p.landlord_name && <> | {t('landlord', 'Landlord')}: {p.landlord_name}</>}
            <br />
            {t('lease', 'Lease')}: {p.lease_start} to {p.lease_end}
            {p.lease_amount && <> | {t('amount', 'Amount')}: {p.lease_amount}</>}
            <br />
            <button
              style={{ marginTop: 4, marginRight: 8 }}
              onClick={() => onEditProperty(p)}
            >
              {t('edit', 'Edit')}
            </button>
            <button
              style={{
                marginTop: 4,
                background: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                marginRight: 8,
              }}
              onClick={() => onDeleteProperty(p.id)}
            >
              {t('delete', 'Delete')}
            </button>
            <button
              style={{
                marginTop: 4,
                marginRight: 8,
                background: expandedPropertyId === p.id ? "#444" : "#0cf",
                color: "#fff",
                border: "none",
                borderRadius: 3,
              }}
              onClick={() =>
                onExpandProperty(expandedPropertyId === p.id ? null : p.id)
              }
            >
              {expandedPropertyId === p.id ? t('hide_units', 'Hide Units') : t('show_units', 'Show Units')}
            </button>
            {/* Lease Schedule Show/Hide Button */}
            <button
              style={{
                marginTop: 4,
                marginRight: 8,
                background: leaseScheduleOpenId === p.id ? "#444" : "#00cc99",
                color: "#fff",
                border: "none",
                borderRadius: 3,
              }}
              onClick={() => {
                if (leaseScheduleOpenId === p.id) {
                  handleHideSchedule();
                } else {
                  showLeaseSchedule(p.id);
                }
              }}
            >
              {leaseScheduleOpenId === p.id ? "Hide Lease Schedule" : "Show Lease Schedule"}
            </button>
            {/* Expanded units for this property */}
            {expandedPropertyId === p.id && (
              <div style={{ marginLeft: 16, marginTop: 8 }}>
                {renderUnitsForProperty && renderUnitsForProperty(p.id)}
              </div>
            )}
            {/* Lease Payment Table, only for this property */}
            {leaseScheduleOpenId === p.id && (
              <div style={{ marginTop: 8, marginLeft: 16 }}>
                <h5>Lease Payment Schedule</h5>
                {loadingLease && <p>Loading schedule...</p>}
                {!loadingLease && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Paid</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leasePayments[p.id] || []).map(lp => (
                        <tr key={lp.id}>
                          <td>{lp.due_date}</td>
                          <td>{lp.amount_due}</td>
                          <td>{lp.status}</td>
                          <td>{lp.amount_paid || 0}</td>
                          <td>
                            {lp.status !== "paid" ? (
                              <LeasePartialPaymentForm
                                payment={lp}
                                onPay={amt => handleLeasePartialPayment(lp, amt)}
                              />
                            ) : t("paid", "Paid")}
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

export default PropertiesList;
