import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

async function generateLeasePayments(property) {
  if (!property.lease_start || !property.lease_end) return;

  const start = new Date(property.lease_start);
  const end = new Date(property.lease_end);

  let dueDates = [];
  let current = new Date(start);

  const frequency = property.payment_frequency || "monthly";

  while (current <= end) {
    dueDates.push(new Date(current));
    // Increment by frequency
    if (frequency === "monthly") current.setMonth(current.getMonth() + 1);
    else if (frequency === "quarterly") current.setMonth(current.getMonth() + 3);
    else if (frequency === "yearly") current.setFullYear(current.getFullYear() + 1);
    else break;
  }

  const leasePayments = dueDates.map(due => ({
    property_id: property.id,
    due_date: due.toISOString().slice(0, 10),
    amount_due: Number(property.lease_amount),
    status: "pending",
  }));
  console.log('About to insert lease payments:', leasePayments);
  if (leasePayments.length) {
    const { error } = await supabase.from("lease_payments").insert(leasePayments);
    if (error) alert("Error creating lease payments: " + error.message);
  }
}

function ReceivablePartialPaymentForm({ payment, onPay }) {
  const [amount, setAmount] = React.useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (amount && Number(amount) > 0) {
          onPay(Number(amount));
          setAmount('');
        }
      }}
      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
    >
      <input
        type="number"
        min="1"
        max={payment.amount_due - (payment.amount_paid || 0)}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Add amount"
        style={{ width: 70, padding: 2 }}
      />
      <button type="submit">Add</button>
    </form>
  );
}

function LeasePartialPaymentForm({ payment, onPay }) {
  const [amount, setAmount] = React.useState('');
    return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (amount && Number(amount) > 0) {
          onPay(Number(amount));
          setAmount('');
        }
      }}
      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
    >
      <input
        type="number"
        min="1"
        max={payment.amount_due - (payment.amount_paid || 0)}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Add amount"
        style={{ width: 70, padding: 2 }}
      />
      <button type="submit">Add</button>
    </form>
  );
}

function Admin() {
  // Properties
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_name: '',
    landlord_name: '',
    ownership_type: '',
    lease_start: '',
    lease_end: '',
    lease_amount: '',
    payment_frequency: '',
  });
  const [editingProperty, setEditingProperty] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [paidAtInput, setPaidAtInput] = useState({});

  // Units
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unit_name: '',
    unit_type: '',
    floor: '',
    size_sq_m: '',
    status: 'vacant',
  });
  const [addingUnit, setAddingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  // Clients
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientForm, setClientForm] = useState({
    client_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    whatsapp_number: '',
    address: '',
  });
  const [addingClient, setAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Contracts
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [contractForm, setContractForm] = useState({
    property_id: '',
    unit_id: '',
    client_id: '',
    contract_start: '',
    contract_end: '',
    rent_amount: '',
    payment_frequency: 'monthly',
    security_deposit: '',
  });
  const [addingContract, setAddingContract] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // Rent Receivables
  const [rentReceivables, setRentReceivables] = useState([]);
  // Rent LeasePayments
  const [leasePayments, setLeasePayments] = useState([]);

  // ...handlers and fetchers continue in next chunk...
  // ===== Property Handlers =====
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);

    if (editingProperty) {
      const { error } = await supabase
        .from('properties')
        .update({
          property_name: form.property_name,
          landlord_name: form.landlord_name,
          ownership_type: form.ownership_type,
          lease_start: form.lease_start,
          lease_end: form.lease_end,
          lease_amount: form.lease_amount ? Number(form.lease_amount) : null,
          payment_frequency: form.payment_frequency,
        })
        .eq('id', editingProperty.id);

      setAdding(false);
      if (error) alert('Error updating property: ' + error.message);
      else {
        setEditingProperty(null);
        setForm({
          property_name: '',
          landlord_name: '',
          ownership_type: '',
          lease_start: '',
          lease_end: '',
          lease_amount: '',
          payment_frequency: '',
        });
        fetchProperties();
      }
    } else {
      const { data, error } = await supabase.from('properties').insert([{
        property_name: form.property_name,
        landlord_name: form.landlord_name,
        ownership_type: form.ownership_type,
        lease_start: form.lease_start,
        lease_end: form.lease_end,
        lease_amount: form.lease_amount ? Number(form.lease_amount) : null,
        payment_frequency: form.payment_frequency,
      }]).select().single();

      setAdding(false);
      if (error) alert('Error adding property: ' + error.message);
      else {
        if (data && data.ownership_type === "leased") {
          await generateLeasePayments(data); // generate schedule
          setSelectedPropertyId(data.id);    // select this property
          await fetchLeasePayments(data.id); // fetch the payments for this property
        }
        setForm({
          property_name: '',
          landlord_name: '',
          ownership_type: '',
          lease_start: '',
          lease_end: '',
          lease_amount: '',
          payment_frequency: '',
        });
        fetchProperties();
      }
    }
  };

  // ===== Unit Handlers =====
  const handleUnitChange = (e) => setUnitForm({ ...unitForm, [e.target.name]: e.target.value });
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    setAddingUnit(true);

    if (editingUnit) {
      const { error } = await supabase
        .from('units')
        .update({
          property_id: selectedPropertyId,
          unit_name: unitForm.unit_name,
          unit_type: unitForm.unit_type,
          floor: unitForm.floor,
          size_sq_m: unitForm.size_sq_m ? Number(unitForm.size_sq_m) : null,
          status: unitForm.status,
        })
        .eq('id', editingUnit.id);

      setAddingUnit(false);
      if (error) alert('Error updating unit: ' + error.message);
      else {
        setEditingUnit(null);
        setUnitForm({
          unit_name: '',
          unit_type: '',
          floor: '',
          size_sq_m: '',
          status: 'vacant',
        });
        fetchUnits(selectedPropertyId);
      }
    } else {
      const { error } = await supabase.from('units').insert([{
        property_id: selectedPropertyId,
        unit_name: unitForm.unit_name,
        unit_type: unitForm.unit_type,
        floor: unitForm.floor,
        size_sq_m: unitForm.size_sq_m ? Number(unitForm.size_sq_m) : null,
        status: unitForm.status,
      }]);
      setAddingUnit(false);
      if (error) alert('Error adding unit: ' + error.message);
      else {
        setUnitForm({
          unit_name: '',
          unit_type: '',
          floor: '',
          size_sq_m: '',
          status: 'vacant',
        });
        fetchUnits(selectedPropertyId);
      }
    }
  };
  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (error) {
      alert('Error deleting unit: ' + error.message);
    } else {
      if (editingUnit && editingUnit.id === unitId) {
        setEditingUnit(null);
        setUnitForm({
          unit_name: '',
          unit_type: '',
          floor: '',
          size_sq_m: '',
          status: 'vacant',
        });
      }
      fetchUnits(selectedPropertyId);
    }
  };

  // ===== Clients Handlers =====
  const handleClientChange = (e) => setClientForm({ ...clientForm, [e.target.name]: e.target.value });
  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setAddingClient(true);

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update({
          client_name: clientForm.client_name,
          contact_person: clientForm.contact_person,
          contact_phone: clientForm.contact_phone,
          contact_email: clientForm.contact_email,
          whatsapp_number: clientForm.whatsapp_number,
          address: clientForm.address,
        })
        .eq('id', editingClient.id);

      setAddingClient(false);
      if (error) alert('Error updating client: ' + error.message);
      else {
        setEditingClient(null);
        setClientForm({
          client_name: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          whatsapp_number: '',
          address: '',
        });
        fetchClients();
      }
    } else {
      const { error } = await supabase.from('clients').insert([{
        client_name: clientForm.client_name,
        contact_person: clientForm.contact_person,
        contact_phone: clientForm.contact_phone,
        contact_email: clientForm.contact_email,
        whatsapp_number: clientForm.whatsapp_number,
        address: clientForm.address,
      }]);
      setAddingClient(false);
      if (error) alert('Error adding client: ' + error.message);
      else {
        setClientForm({
          client_name: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          whatsapp_number: '',
          address: '',
        });
        fetchClients();
      }
    }
  };
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) {
      alert('Error deleting client: ' + error.message);
    } else {
      if (editingClient && editingClient.id === clientId) {
        setEditingClient(null);
        setClientForm({
          client_name: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          whatsapp_number: '',
          address: '',
        });
      }
      fetchClients();
    }
  };

  // ===== Contracts Handlers =====
  // ...continue in next chunk...
  const handleContractChange = (e) => setContractForm({ ...contractForm, [e.target.name]: e.target.value });
  const handleContractSubmit = async (e) => {
    e.preventDefault();
    setAddingContract(true);

    if (editingContract) {
      const { error } = await supabase
        .from('contracts')
        .update({
          property_id: contractForm.property_id,
          unit_id: contractForm.unit_id,
          client_id: contractForm.client_id,
          contract_start: contractForm.contract_start,
          contract_end: contractForm.contract_end,
          rent_amount: contractForm.rent_amount ? Number(contractForm.rent_amount) : null,
          payment_frequency: contractForm.payment_frequency,
          security_deposit: contractForm.security_deposit ? Number(contractForm.security_deposit) : null,
        })
        .eq('id', editingContract.id);

      setAddingContract(false);
      if (error) alert('Error updating contract: ' + error.message);
      else {
        setEditingContract(null);
        setContractForm({
          property_id: '',
          unit_id: '',
          client_id: '',
          contract_start: '',
          contract_end: '',
          rent_amount: '',
          payment_frequency: 'monthly',
          security_deposit: '',
        });
        fetchContracts();
      }
    } else {
      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          property_id: contractForm.property_id,
          unit_id: contractForm.unit_id,
          client_id: contractForm.client_id,
          contract_start: contractForm.contract_start,
          contract_end: contractForm.contract_end,
          rent_amount: contractForm.rent_amount ? Number(contractForm.rent_amount) : null,
          payment_frequency: contractForm.payment_frequency,
          security_deposit: contractForm.security_deposit ? Number(contractForm.security_deposit) : null,
        }])
        .select('id')
        .single();

      setAddingContract(false);
      if (error) alert('Error adding contract: ' + error.message);
      else {
        await supabase.rpc('generate_rent_receivables', { contract_id: data.id });
        setContractForm({
          property_id: '',
          unit_id: '',
          client_id: '',
          contract_start: '',
          contract_end: '',
          rent_amount: '',
          payment_frequency: 'monthly',
          security_deposit: '',
        });
        fetchContracts();
      }
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    const { error } = await supabase.from('contracts').delete().eq('id', contractId);
    if (error) {
      alert('Error deleting contract: ' + error.message);
    } else {
      if (editingContract && editingContract.id === contractId) {
        setEditingContract(null);
        setContractForm({
          property_id: '',
          unit_id: '',
          client_id: '',
          contract_start: '',
          contract_end: '',
          rent_amount: '',
          payment_frequency: 'monthly',
          security_deposit: '',
        });
      }
      fetchContracts();
    }
  };

  // ===== Rent Receivables Handlers =====
  const markAsPaid = async (rentId, paidDate) => {
    if (!paidDate) {
      alert("Please select a paid date.");
      return;
    }
    const { error } = await supabase
      .from('rent_receivables')
      .update({ status: 'paid', paid_date: paidDate })
      .eq('id', rentId);
    if (error) {
      alert('Error marking as paid: ' + error.message);
    } else {
      setRentReceivables(rentReceivables.map(r =>
        r.id === rentId ? { ...r, status: 'paid', paid_date: paidDate } : r
      ));
      setPaidAtInput(prev => ({ ...prev, [rentId]: "" }));
    }
  };
  const undoPaid = async (rentId) => {
    const { error } = await supabase
      .from('rent_receivables')
      .update({ status: 'pending', paid_at: null, paid_date: null })
      .eq('id', rentId);
    if (error) {
      alert('Error undoing paid: ' + error.message);
    } else {
      setRentReceivables(rentReceivables.map(r =>
        r.id === rentId ? { ...r, status: 'pending', paid_at: null, paid_date: null } : r
      ));
    }
  };
  const markLeasePaid = async (leasePaymentId, status) => {
    const { error } = await supabase
      .from('lease_payments')
      .update({ status })
      .eq('id', leasePaymentId);
    if (error) {
      alert("Error updating lease payment: " + error.message);
    } else {
      if (leasePayments.length > 0) {
        fetchLeasePayments(leasePayments[0].property_id);
      }
    }
  };

  // ===== Fetchers =====
  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProperties(data);
    setLoading(false);
  };
  const fetchUnits = async (propertyId) => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    setLoadingUnits(true);
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    if (!error) setUnits(data);
    setLoadingUnits(false);
  };
  const fetchClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setClients(data);
    setLoadingClients(false);
  };
  const fetchContracts = async () => {
    setLoadingContracts(true);
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        units:unit_id (unit_name),
        clients:client_id (client_name),
        properties:property_id (property_name)
      `)
      .order('created_at', { ascending: false });
    if (!error) setContracts(data);
    setLoadingContracts(false);
  };
  const fetchRentReceivables = async (contractId) => {
    const { data, error } = await supabase
      .from('rent_receivables')
      .select('*')
      .eq('contract_id', contractId)
      .order('due_date', { ascending: true });
    if (!error) setRentReceivables(data);
  };
  const fetchLeasePayments = async (propertyId) => {
    const { data, error } = await supabase
      .from('lease_payments')
      .select('*')
      .eq('property_id', propertyId)
      .order('due_date', { ascending: true });
    if (!error) setLeasePayments(data || []);
  };

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
    if (!error) fetchLeasePayments(lp.property_id);
    else alert("Error updating payment: " + error.message);
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
    if (!error) fetchRentReceivables(r.contract_id);
    else alert("Error updating payment: " + error.message);
  };

  // ===== useEffects =====
  useEffect(() => {
    fetchProperties();
    fetchClients();
    fetchContracts();
  }, []);
  useEffect(() => {
    fetchUnits(selectedPropertyId);
  }, [selectedPropertyId]);
 
// ========== RENDER SECTION BELOW ==========
return (
  <div style={{ width: "100vw", minHeight: "100vh", background: "none" }}>
    <div
      className="admin-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "24px",
        padding: "36px 24px",
        maxWidth: "100vw",
        alignItems: "flex-start"
      }}
    >
      {/* PROPERTIES SECTION */}
      <div className="glass-card">
        <h2 style={{ marginBottom: 24 }}>Urban Market – Properties</h2>
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <h4>{editingProperty ? "Edit Property" : "Add Property"}</h4>
          <input type="text" name="property_name" placeholder="Property Name" value={form.property_name} onChange={handleChange} required />
          <input type="text" name="landlord_name" placeholder="Landlord Name" value={form.landlord_name} onChange={handleChange} />
          <select name="ownership_type" value={form.ownership_type} onChange={handleChange} required>
            <option value="">-- Select Ownership --</option>
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
          </select>
          {form.ownership_type === 'leased' && (
            <>
              <input type="date" name="lease_start" placeholder="Lease Start" value={form.lease_start} onChange={handleChange} required />
              <input type="date" name="lease_end" placeholder="Lease End" value={form.lease_end} onChange={handleChange} required />
              <input type="number" name="lease_amount" placeholder="Lease Amount (ر.س)" value={form.lease_amount} onChange={handleChange} required min="0" />
              <select name="payment_frequency" value={form.payment_frequency} onChange={handleChange} required>
                <option value="">-- Payment Frequency --</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </>
          )}
          <button type="submit" disabled={adding}>
            {adding ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
          </button>
          {editingProperty && (
            <button
              type="button"
              onClick={() => {
                setEditingProperty(null);
                setForm({
                  property_name: '',
                  landlord_name: '',
                  ownership_type: '',
                  lease_start: '',
                  lease_end: '',
                  lease_amount: '',
                  payment_frequency: '',
                });
              }}
              style={{ marginLeft: 12 }}
            >
              Cancel
            </button>
          )}
        </form>
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="propertySelect"><strong>Select Property:</strong></label>
          <select id="propertySelect" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} style={{ marginLeft: 8, padding: 6 }}>
            <option value="">-- Choose a property --</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.property_name}</option>
            ))}
          </select>
        </div>
        {selectedPropertyId && (
          <form onSubmit={handleUnitSubmit} style={{ marginBottom: 24 }}>
            <h4>{editingUnit ? "Edit Unit" : "Add Unit/Space to Property"}</h4>
            <input type="text" name="unit_name" placeholder="Unit Name (e.g. Shop 1)" value={unitForm.unit_name} onChange={handleUnitChange} required />
            <input type="text" name="unit_type" placeholder="Unit Type (shop, office, etc.)" value={unitForm.unit_type} onChange={handleUnitChange} />
            <input type="text" name="floor" placeholder="Floor (e.g. Ground, 1st)" value={unitForm.floor} onChange={handleUnitChange} />
            <input type="number" name="size_sq_m" placeholder="Size (sq. meters)" value={unitForm.size_sq_m} onChange={handleUnitChange} min="0" step="0.01" />
            <select name="status" value={unitForm.status} onChange={handleUnitChange}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
            <button type="submit" disabled={addingUnit}>
              {addingUnit ? 'Saving...' : editingUnit ? 'Update Unit' : 'Add Unit'}
            </button>
            {editingUnit && (
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setUnitForm({
                    unit_name: '',
                    unit_type: '',
                    floor: '',
                    size_sq_m: '',
                    status: 'vacant',
                  });
                }}
                style={{ marginLeft: 12 }}
              >
                Cancel
              </button>
            )}
          </form>
        )}
        {selectedPropertyId && (
          <div style={{ marginBottom: 32 }}>
            <h4>Units for Selected Property</h4>
            {loadingUnits && <p>Loading units...</p>}
            {!loadingUnits && units.length === 0 && <p>No units found for this property.</p>}
            <ul>
              {units.map((u) => (
                <li key={u.id}>
                  <strong>{u.unit_name}</strong>
                  {u.unit_type && <> | Type: {u.unit_type}</>}
                  {u.floor && <> | Floor: {u.floor}</>}
                  {u.size_sq_m && <> | Size: {u.size_sq_m} m²</>}
                  {u.status && <> | Status: {u.status}</>}
                  <br />
                  <button
                    style={{ marginTop: 4, marginRight: 8 }}
                    onClick={() => {
                      setEditingUnit(u);
                      setUnitForm({
                        unit_name: u.unit_name || "",
                        unit_type: u.unit_type || "",
                        floor: u.floor || "",
                        size_sq_m: u.size_sq_m || "",
                        status: u.status || "vacant",
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      marginTop: 4,
                      background: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 3,
                      marginRight: 8,
                    }}
                    onClick={() => handleDeleteUnit(u.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h4>All Properties</h4>
        {loading && <p>Loading properties...</p>}
        {!loading && properties.length === 0 && <p>No properties found.</p>}
        <ul>
          {properties.map((p) => (
            <li key={p.id} style={{ marginBottom: 8 }}>
              <strong>{p.property_name}</strong>
              {p.landlord_name && <> | Landlord: {p.landlord_name}</>}
              <br />
              Lease: {p.lease_start} to {p.lease_end}
              {p.lease_amount && <> | Amount: {p.lease_amount}</>}
              <br />
              <button
                style={{ marginTop: 4, marginRight: 8 }}
                onClick={() => {
                  setEditingProperty(p);
                  setForm({
                    property_name: p.property_name || '',
                    landlord_name: p.landlord_name || '',
                    ownership_type: p.ownership_type || '',
                    lease_start: p.lease_start || '',
                    lease_end: p.lease_end || '',
                    lease_amount: p.lease_amount || '',
                    payment_frequency: p.payment_frequency || '',
                  });
                }}
              >
                Edit
              </button>
              <button
                style={{
                  marginTop: 4,
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 3,
                  marginRight: 8,
                }}
                onClick={() => handleDeleteProperty(p.id)}
              >
                Delete
              </button>
              <button
                style={{ marginTop: 4, marginRight: 8 }}
                onClick={() => fetchLeasePayments(p.id)}
              >
                Show Lease Schedule
              </button>
            </li>
          ))}
        </ul>
        {leasePayments.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4>Lease Payment Schedule</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leasePayments.map(lp => (
                  <tr key={lp.id}>
                    <td>{lp.due_date}</td>
                    <td>{lp.amount_due}</td>
                    <td>
                      {lp.amount_paid || 0}
                      {" / "}
                      <span style={{ color: 'orange' }}>
                        Remain: {(lp.amount_due - (lp.amount_paid || 0)).toFixed(2)}
                      </span>
                    </td>
                    <td>{lp.status}</td>
                    <td>{lp.paid_at || '-'}</td>
                    <td>
                      {(lp.status !== "paid") && (
                        <LeasePartialPaymentForm
                          payment={lp}
                          onPay={async (amt) => await handleLeasePartialPayment(lp, amt)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* CLIENTS SECTION */}
      <div className="glass-card">
        <h2 style={{ marginTop: 0 }}>Clients</h2>
        <form onSubmit={handleClientSubmit} style={{ marginBottom: 32 }}>
          <h4>{editingClient ? "Edit Client" : "Add Client"}</h4>
          <input type="text" name="client_name" placeholder="Client Name" value={clientForm.client_name} onChange={handleClientChange} required />
          <input type="text" name="contact_person" placeholder="Contact Person" value={clientForm.contact_person} onChange={handleClientChange} />
          <input type="text" name="contact_phone" placeholder="Contact Phone" value={clientForm.contact_phone} onChange={handleClientChange} />
          <input type="email" name="contact_email" placeholder="Contact Email" value={clientForm.contact_email} onChange={handleClientChange} />
          <input type="text" name="whatsapp_number" placeholder="WhatsApp Number" value={clientForm.whatsapp_number} onChange={handleClientChange} />
          <input type="text" name="address" placeholder="Address" value={clientForm.address} onChange={handleClientChange} />
          <button type="submit" disabled={addingClient}>
            {addingClient ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
          </button>
          {editingClient && (
            <button
              type="button"
              onClick={() => {
                setEditingClient(null);
                setClientForm({
                  client_name: '',
                  contact_person: '',
                  contact_phone: '',
                  contact_email: '',
                  whatsapp_number: '',
                  address: '',
                });
              }}
              style={{ marginLeft: 12 }}
            >
              Cancel
            </button>
          )}
        </form>
        <h4>All Clients</h4>
        {loadingClients && <p>Loading clients...</p>}
        {!loadingClients && clients.length === 0 && <p>No clients found.</p>}
        <ul>
          {clients.map((c) => (
            <li key={c.id}>
              <strong>{c.client_name}</strong>
              {c.contact_person && <> | Contact: {c.contact_person}</>}
              {c.contact_phone && <> | Phone: {c.contact_phone}</>}
              {c.whatsapp_number && <> | WhatsApp: {c.whatsapp_number}</>}
              {c.address && <> | Address: {c.address}</>}
              <br />
              <button
                style={{ marginTop: 4, marginRight: 8 }}
                onClick={() => {
                  setEditingClient(c);
                  setClientForm({
                    client_name: c.client_name || "",
                    contact_person: c.contact_person || "",
                    contact_phone: c.contact_phone || "",
                    contact_email: c.contact_email || "",
                    whatsapp_number: c.whatsapp_number || "",
                    address: c.address || "",
                  });
                }}
              >
                Edit
              </button>
              <button
                style={{
                  marginTop: 4,
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 3,
                }}
                onClick={() => handleDeleteClient(c.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* CONTRACTS SECTION */}
      <div className="glass-card">
        <h2 style={{ marginTop: 0 }}>Contracts</h2>
        <form onSubmit={handleContractSubmit} style={{ marginBottom: 32 }}>
          <h4>{editingContract ? "Edit Contract" : "Add Contract"}</h4>
          <select
            name="property_id"
            value={contractForm.property_id}
            onChange={handleContractChange}
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
            onChange={handleContractChange}
            required
            disabled={!contractForm.property_id}
          >
            <option value="">-- Select Unit --</option>
            {units
              .filter(u => u.status === 'vacant' || u.id === contractForm.unit_id)
              .map(u => (
                <option key={u.id} value={u.id}>{u.unit_name}</option>
              ))}
          </select>
          <select
            name="client_id"
            value={contractForm.client_id}
            onChange={handleContractChange}
            required
          >
            <option value="">-- Select Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.client_name}</option>
            ))}
          </select>
          <input type="date" name="contract_start" value={contractForm.contract_start} onChange={handleContractChange} required />
          <input type="date" name="contract_end" value={contractForm.contract_end} onChange={handleContractChange} required />
          <input type="number" name="rent_amount" placeholder="Rent Amount" value={contractForm.rent_amount} onChange={handleContractChange} min="0" step="0.01" />
          <select
            name="payment_frequency"
            value={contractForm.payment_frequency}
            onChange={handleContractChange}
            required
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half-yearly">Half-Yearly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="number" name="security_deposit" placeholder="Security Deposit" value={contractForm.security_deposit} onChange={handleContractChange} min="0" step="0.01" />
          <button type="submit" disabled={addingContract}>
            {addingContract ? 'Saving...' : editingContract ? 'Update Contract' : 'Add Contract'}
          </button>
          {editingContract && (
            <button
              type="button"
              onClick={() => {
                setEditingContract(null);
                setContractForm({
                  property_id: '',
                  unit_id: '',
                  client_id: '',
                  contract_start: '',
                  contract_end: '',
                  rent_amount: '',
                  payment_frequency: 'monthly',
                  security_deposit: '',
                });
              }}
              style={{ marginLeft: 12 }}
            >
              Cancel
            </button>
          )}
        </form>
        <h4>All Contracts</h4>
        {loadingContracts && <p>Loading contracts...</p>}
        {!loadingContracts && contracts.length === 0 && <p>No contracts found.</p>}
        <ul>
          {contracts.map((ctr) => (
            <li key={ctr.id} style={{ marginBottom: 16 }}>
              <strong>
                {ctr.clients?.client_name} renting {ctr.units?.unit_name} in {ctr.properties?.property_name}
              </strong>
              <br />
              {ctr.contract_start} to {ctr.contract_end} | {ctr.payment_frequency} | Rent: {ctr.rent_amount}
              <br />
              <button
                style={{ marginTop: 6, marginRight: 8 }}
                onClick={() => {
                  setEditingContract(ctr);
                  setContractForm({
                    property_id: ctr.property_id || "",
                    unit_id: ctr.unit_id || "",
                    client_id: ctr.client_id || "",
                    contract_start: ctr.contract_start || "",
                    contract_end: ctr.contract_end || "",
                    rent_amount: ctr.rent_amount || "",
                    payment_frequency: ctr.payment_frequency || "monthly",
                    security_deposit: ctr.security_deposit || "",
                  });
                }}
              >
                Edit
              </button>
              <button
                style={{ marginTop: 6, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 3, marginRight: 10 }}
                onClick={() => handleDeleteContract(ctr.id)}
              >
                Delete
              </button>
              <button
                style={{ marginTop: 6, marginBottom: 6 }}
                onClick={() => fetchRentReceivables(ctr.id)}
              >
                Show Rent Schedule
              </button>
              {rentReceivables.length > 0 && rentReceivables[0].contract_id === ctr.id && (
                <table style={{ marginTop: 8, borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Due Date</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Amount</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Status</th>
                      <th style={{ border: '1px solid #ddd', padding: 4 }}>Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentReceivables.map(r => (
                      <tr key={r.id}>
                        <td>{r.due_date}</td>
                        <td>{r.amount_due}</td>
                        <td>
                          {r.amount_paid || 0}
                          {" / "}
                          <span style={{ color: 'orange' }}>
                            Remain: {(r.amount_due - (r.amount_paid || 0)).toFixed(2)}
                          </span>
                        </td>
                        <td>{r.status}</td>
                        <td>{r.paid_at || '-'}</td>
                        <td>
                          {(r.status !== "paid") && (
                            <ReceivablePartialPaymentForm
                              payment={r}
                              onPay={async (amt) => await handleReceivablePartialPayment(r, amt)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);
} 
export default Admin;
