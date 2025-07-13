import React from "react";

function ClientForm({
  clientForm,
  editingClient,
  addingClient,
  onChange,
  onSubmit,
  onCancel
}) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 32 }}>
      <h4>{editingClient ? "Edit Client" : "Add Client"}</h4>
      <input
        type="text"
        name="client_name"
        placeholder="Client Name"
        value={clientForm.client_name}
        onChange={onChange}
        required
      />
      <input
        type="text"
        name="contact_person"
        placeholder="Contact Person"
        value={clientForm.contact_person}
        onChange={onChange}
      />
      <input
        type="text"
        name="contact_phone"
        placeholder="Contact Phone"
        value={clientForm.contact_phone}
        onChange={onChange}
      />
      <input
        type="email"
        name="contact_email"
        placeholder="Contact Email"
        value={clientForm.contact_email}
        onChange={onChange}
      />
      <input
        type="text"
        name="whatsapp_number"
        placeholder="WhatsApp Number"
        value={clientForm.whatsapp_number}
        onChange={onChange}
      />
      <input
        type="text"
        name="address"
        placeholder="Address"
        value={clientForm.address}
        onChange={onChange}
      />
      <button type="submit" disabled={addingClient}>
        {addingClient ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
      </button>
      {editingClient && (
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

export default ClientForm;
