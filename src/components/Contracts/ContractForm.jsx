import React from "react";

function ContractForm({
  contractForm,
  properties,
  units,
  clients,
  editingContract,
  addingContract,
  onChange,
  onSubmit,
  onCancel
}) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 32 }}>
      <h4>{editingContract ? "Edit Contract" : "Add Contract"}</h4>
      <select
        name="property_id"
        value={contractForm.property_id}
        onChange={onChange}
        required
      >
        <option value="">-- Select Property --</option>
        {properties.map(p => (
          <option key={p.id} value={p.id}>{p.property_name}</option>
        ))}
      </select>
      <select
        name="unit_id"
        value={contractForm.unit_id}
        onChange={onChange}
        required
        disabled={!contractForm.property_id}
      >
        <option value="">-- Select Unit --</option>
        {units.map(u => (
          <option key={u.id} value={u.id}>{u.unit_name}</option>
        ))}
      </select>
      <select
        name="client_id"
        value={contractForm.client_id}
        onChange={onChange}
        required
      >
        <option value="">-- Select Client --</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>{c.client_name}</option>
        ))}
      </select>
      <input
        type="date"
        name="contract_start"
        value={contractForm.contract_start}
        onChange={onChange}
        required
      />
      <input
        type="date"
        name="contract_end"
        value={contractForm.contract_end}
        onChange={onChange}
        required
      />
      <input
        type="number"
        name="rent_amount"
        placeholder="Rent Amount"
        value={contractForm.rent_amount}
        onChange={onChange}
        min="0"
        step="0.01"
      />
      <select
        name="payment_frequency"
        value={contractForm.payment_frequency}
        onChange={onChange}
        required
      >
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="half-yearly">Half-Yearly</option>
        <option value="yearly">Yearly</option>
      </select>
      <input
        type="number"
        name="security_deposit"
        placeholder="Security Deposit"
        value={contractForm.security_deposit}
        onChange={onChange}
        min="0"
        step="0.01"
      />
      <button type="submit" disabled={addingContract}>
        {addingContract ? 'Saving...' : editingContract ? 'Update Contract' : 'Add Contract'}
      </button>
      {editingContract && (
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

export default ContractForm;
