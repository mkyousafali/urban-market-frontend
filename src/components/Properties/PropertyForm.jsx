import React from "react";

function PropertyForm({
  form,
  editingProperty,
  adding,
  onChange,
  onSubmit,
  onCancel,
  paymentFrequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "half-yearly", label: "Half-Yearly" },
    { value: "yearly", label: "Yearly" }
  ]
}) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 32 }}>
      <h4>{editingProperty ? "Edit Property" : "Add Property"}</h4>
      <input
        type="text"
        name="property_name"
        placeholder="Property Name"
        value={form.property_name}
        onChange={onChange}
        required
      />
      <input
        type="text"
        name="landlord_name"
        placeholder="Landlord Name"
        value={form.landlord_name}
        onChange={onChange}
      />
      <select
        name="ownership_type"
        value={form.ownership_type}
        onChange={onChange}
        required
      >
        <option value="">-- Select Ownership --</option>
        <option value="owned">Owned</option>
        <option value="leased">Leased</option>
      </select>
      {form.ownership_type === "leased" && (
        <>
          <input
            type="date"
            name="lease_start"
            placeholder="Lease Start"
            value={form.lease_start}
            onChange={onChange}
            required
          />
          <input
            type="date"
            name="lease_end"
            placeholder="Lease End"
            value={form.lease_end}
            onChange={onChange}
            required
          />
          <input
            type="number"
            name="lease_amount"
            placeholder="Lease Amount (ر.س)"
            value={form.lease_amount}
            onChange={onChange}
            required
            min="0"
          />
          <select
            name="payment_frequency"
            value={form.payment_frequency}
            onChange={onChange}
            required
          >
            <option value="">-- Payment Frequency --</option>
            {paymentFrequencyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </>
      )}
      <button type="submit" disabled={adding}>
        {adding ? "Saving..." : editingProperty ? "Update Property" : "Add Property"}
      </button>
      {editingProperty && (
        <button
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 12 }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

export default PropertyForm;
