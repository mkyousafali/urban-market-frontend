// Admin.jsx v11 – All Features, Prop Passing, Expand/Collapse, i18n, Lease/Rent, Fully Synced

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import PropertyForm from "./Properties/PropertyForm";
import PropertiesList from "./Properties/PropertiesList";
import UnitForm from "./Units/UnitForm";
import UnitsList from "./Units/UnitsList";
import ClientForm from "./Clients/ClientForm";
import ClientsList from "./Clients/ClientsList";
import ContractForm from "./Contracts/ContractForm";
import ContractsList from "./Contracts/ContractsList";
import LeasePartialPaymentForm from "./LeasePartialPaymentForm";
import ReceivablePartialPaymentForm from "./ReceivablePartialPaymentForm";
import { useTranslation } from "react-i18next";

// =========== Lease Payment Generator ===============
async function generateLeasePayments(property) {
  if (!property.lease_start || !property.lease_end) return;

  const start = new Date(property.lease_start);
  const end = new Date(property.lease_end);

  let dueDates = [];
  let current = new Date(start);

  const frequency = property.payment_frequency || "monthly";
  while (current <= end) {
    dueDates.push(new Date(current));
    if (frequency === "monthly") current.setMonth(current.getMonth() + 1);
    else if (frequency === "quarterly") current.setMonth(current.getMonth() + 3);
    else if (frequency === "half-yearly" || frequency === "halfyearly" || frequency === "6-month" || frequency === "6months") current.setMonth(current.getMonth() + 6);
    else if (frequency === "yearly") current.setFullYear(current.getFullYear() + 1);
    else break;
  }

  const leasePayments = dueDates.map(due => ({
    property_id: property.id,
    due_date: due.toISOString().slice(0, 10),
    amount_due: Number(property.lease_amount),
    status: "pending",
  }));
  if (leasePayments.length) {
    const { error } = await supabase.from("lease_payments").insert(leasePayments);
    if (error) alert("Error creating lease payments: " + error.message);
  }
}

function Admin() {
  const { t, i18n } = useTranslation();

  // Language Switcher
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // All State Hooks
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_name: "",
    landlord_name: "",
    ownership_type: "",
    lease_start: "",
    lease_end: "",
    lease_amount: "",
    payment_frequency: "",
  });
  const [editingProperty, setEditingProperty] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPropertiesList, setShowPropertiesList] = useState(true);
  const [expandedPropertyId, setExpandedPropertyId] = useState(null);

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unit_name: "",
    unit_type: "",
    floor: "",
    size_sq_m: "",
    status: "vacant",
  });
  const [addingUnit, setAddingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({
    client_name: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    whatsapp_number: "",
    address: "",
  });
  const [addingClient, setAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(true);
  const [showClientsList, setShowClientsList] = useState(true);
  const [expandedClientId, setExpandedClientId] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [contractForm, setContractForm] = useState({
    property_id: "",
    unit_id: "",
    client_id: "",
    contract_start: "",
    contract_end: "",
    rent_amount: "",
    payment_frequency: "monthly",
    security_deposit: "",
  });
  const [addingContract, setAddingContract] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [showContractsList, setShowContractsList] = useState(true);
  const [expandedContractId, setExpandedContractId] = useState(null);

  // Lease & Rent State
  const [selectedLeasePropertyId, setSelectedLeasePropertyId] = useState(null);
  const [leasePayments, setLeasePayments] = useState([]);
  const [rentReceivables, setRentReceivables] = useState([]);
  const [paidAtInput, setPaidAtInput] = useState({});
  // ===== Fetchers =====
  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
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
      .from("units")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    if (!error) setUnits(data);
    setLoadingUnits(false);
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setClients(data);
    setLoadingClients(false);
  };

  const fetchContracts = async () => {
    setLoadingContracts(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setContracts(data);
    setLoadingContracts(false);
  };

  const fetchLeasePayments = async (propertyId) => {
    const { data, error } = await supabase
      .from("lease_payments")
      .select("*")
      .eq("property_id", propertyId)
      .order("due_date", { ascending: true });
    if (!error) setLeasePayments(data || []);
  };

  const fetchRentReceivables = async (contractId) => {
    const { data, error } = await supabase
      .from("rent_receivables")
      .select("*")
      .eq("contract_id", contractId)
      .order("due_date", { ascending: true });
    if (!error) setRentReceivables(data);
  };

  // ===== useEffects =====
  useEffect(() => {
    fetchProperties();
    fetchClients();
    fetchContracts();
  }, []);

  useEffect(() => {
    fetchUnits(expandedPropertyId);
  }, [expandedPropertyId]);

  // =========== Property Handlers ===========
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);

    if (editingProperty) {
      const { error } = await supabase
        .from("properties")
        .update({
          property_name: form.property_name,
          landlord_name: form.landlord_name,
          ownership_type: form.ownership_type,
          lease_start: form.lease_start,
          lease_end: form.lease_end,
          lease_amount: form.lease_amount ? Number(form.lease_amount) : null,
          payment_frequency: form.payment_frequency,
        })
        .eq("id", editingProperty.id);

      setAdding(false);
      if (error) alert("Error updating property: " + error.message);
      else {
        setEditingProperty(null);
        setForm({
          property_name: "",
          landlord_name: "",
          ownership_type: "",
          lease_start: "",
          lease_end: "",
          lease_amount: "",
          payment_frequency: "",
        });
        fetchProperties();
      }
    } else {
      const { data, error } = await supabase
        .from("properties")
        .insert([{
          property_name: form.property_name,
          landlord_name: form.landlord_name,
          ownership_type: form.ownership_type,
          lease_start: form.lease_start,
          lease_end: form.lease_end,
          lease_amount: form.lease_amount ? Number(form.lease_amount) : null,
          payment_frequency: form.payment_frequency,
        }])
        .select()
        .single();

      setAdding(false);
      if (error) alert("Error adding property: " + error.message);
      else {
        // Lease payment schedule generation (including 6-monthly)
        if (data && data.ownership_type === "leased") {
          await generateLeasePayments(data);
          setSelectedLeasePropertyId(data.id);
          await fetchLeasePayments(data.id);
        }
        setForm({
          property_name: "",
          landlord_name: "",
          ownership_type: "",
          lease_start: "",
          lease_end: "",
          lease_amount: "",
          payment_frequency: "",
        });
        fetchProperties();
      }
    }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setForm({
      property_name: property.property_name || "",
      landlord_name: property.landlord_name || "",
      ownership_type: property.ownership_type || "",
      lease_start: property.lease_start || "",
      lease_end: property.lease_end || "",
      lease_amount: property.lease_amount || "",
      payment_frequency: property.payment_frequency || "",
    });
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) {
      alert("Error deleting property: " + error.message);
    } else {
      if (editingProperty && editingProperty.id === propertyId) {
        setEditingProperty(null);
        setForm({
          property_name: "",
          landlord_name: "",
          ownership_type: "",
          lease_start: "",
          lease_end: "",
          lease_amount: "",
          payment_frequency: "",
        });
      }
      fetchProperties();
    }
  };

  const handleCancelEdit = () => {
    setEditingProperty(null);
    setForm({
      property_name: "",
      landlord_name: "",
      ownership_type: "",
      lease_start: "",
      lease_end: "",
      lease_amount: "",
      payment_frequency: "",
    });
  };

  // ...Next: Unit, Client, Contract, Lease/Rent Handlers and the final render...
  // =========== Unit Handlers ===========
  const handleUnitChange = (e) =>
    setUnitForm({ ...unitForm, [e.target.name]: e.target.value });

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    if (!expandedPropertyId) return;
    setAddingUnit(true);

    if (editingUnit) {
      const { error } = await supabase
        .from("units")
        .update({
          property_id: expandedPropertyId,
          unit_name: unitForm.unit_name,
          unit_type: unitForm.unit_type,
          floor: unitForm.floor,
          size_sq_m: unitForm.size_sq_m ? Number(unitForm.size_sq_m) : null,
          status: unitForm.status,
        })
        .eq("id", editingUnit.id);

      setAddingUnit(false);
      if (error) alert("Error updating unit: " + error.message);
      else {
        setEditingUnit(null);
        setUnitForm({
          unit_name: "",
          unit_type: "",
          floor: "",
          size_sq_m: "",
          status: "vacant",
        });
        fetchUnits(expandedPropertyId);
      }
    } else {
      const { error } = await supabase.from("units").insert([{
        property_id: expandedPropertyId,
        unit_name: unitForm.unit_name,
        unit_type: unitForm.unit_type,
        floor: unitForm.floor,
        size_sq_m: unitForm.size_sq_m ? Number(unitForm.size_sq_m) : null,
        status: unitForm.status,
      }]);
      setAddingUnit(false);
      if (error) alert("Error adding unit: " + error.message);
      else {
        setUnitForm({
          unit_name: "",
          unit_type: "",
          floor: "",
          size_sq_m: "",
          status: "vacant",
        });
        fetchUnits(expandedPropertyId);
      }
    }
  };

  const handleEditUnit = (u) => {
    setEditingUnit(u);
    setUnitForm({
      unit_name: u.unit_name || "",
      unit_type: u.unit_type || "",
      floor: u.floor || "",
      size_sq_m: u.size_sq_m || "",
      status: u.status || "vacant",
    });
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    const { error } = await supabase.from("units").delete().eq("id", unitId);
    if (error) {
      alert("Error deleting unit: " + error.message);
    } else {
      if (editingUnit && editingUnit.id === unitId) {
        setEditingUnit(null);
        setUnitForm({
          unit_name: "",
          unit_type: "",
          floor: "",
          size_sq_m: "",
          status: "vacant",
        });
      }
      fetchUnits(expandedPropertyId);
    }
  };

  const handleCancelEditUnit = () => {
    setEditingUnit(null);
    setUnitForm({
      unit_name: "",
      unit_type: "",
      floor: "",
      size_sq_m: "",
      status: "vacant",
    });
  };

  // =========== Client Handlers ===========
  const handleClientChange = (e) =>
    setClientForm({ ...clientForm, [e.target.name]: e.target.value });

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setAddingClient(true);

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update({
          client_name: clientForm.client_name,
          contact_person: clientForm.contact_person,
          contact_phone: clientForm.contact_phone,
          contact_email: clientForm.contact_email,
          whatsapp_number: clientForm.whatsapp_number,
          address: clientForm.address,
        })
        .eq("id", editingClient.id);

      setAddingClient(false);
      if (error) alert("Error updating client: " + error.message);
      else {
        setEditingClient(null);
        setClientForm({
          client_name: "",
          contact_person: "",
          contact_phone: "",
          contact_email: "",
          whatsapp_number: "",
          address: "",
        });
        fetchClients();
      }
    } else {
      const { error } = await supabase.from("clients").insert([{
        client_name: clientForm.client_name,
        contact_person: clientForm.contact_person,
        contact_phone: clientForm.contact_phone,
        contact_email: clientForm.contact_email,
        whatsapp_number: clientForm.whatsapp_number,
        address: clientForm.address,
      }]);
      setAddingClient(false);
      if (error) alert("Error adding client: " + error.message);
      else {
        setClientForm({
          client_name: "",
          contact_person: "",
          contact_phone: "",
          contact_email: "",
          whatsapp_number: "",
          address: "",
        });
        fetchClients();
      }
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientForm({
      client_name: client.client_name || "",
      contact_person: client.contact_person || "",
      contact_phone: client.contact_phone || "",
      contact_email: client.contact_email || "",
      whatsapp_number: client.whatsapp_number || "",
      address: client.address || "",
    });
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) {
      alert("Error deleting client: " + error.message);
    } else {
      if (editingClient && editingClient.id === clientId) {
        setEditingClient(null);
        setClientForm({
          client_name: "",
          contact_person: "",
          contact_phone: "",
          contact_email: "",
          whatsapp_number: "",
          address: "",
        });
      }
      fetchClients();
    }
  };

  const handleCancelEditClient = () => {
    setEditingClient(null);
    setClientForm({
      client_name: "",
      contact_person: "",
      contact_phone: "",
      contact_email: "",
      whatsapp_number: "",
      address: "",
    });
  };

  // ...Contract, Lease/Rent Handlers and the full render in next chunk...
  // =========== Contract Handlers ===========
  const handleContractChange = (e) =>
    setContractForm({ ...contractForm, [e.target.name]: e.target.value });

const handleContractSubmit = async (e) => {
  e.preventDefault();
  setAddingContract(true);

  if (editingContract) {
    const { error } = await supabase
      .from("contracts")
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
      .eq("id", editingContract.id);

    setAddingContract(false);
    if (error) alert("Error updating contract: " + error.message);
    else {
      setEditingContract(null);
      setContractForm({
        property_id: "",
        unit_id: "",
        client_id: "",
        contract_start: "",
        contract_end: "",
        rent_amount: "",
        payment_frequency: "monthly",
        security_deposit: "",
      });
      fetchContracts();
    }
  } else {
    const { data, error } = await supabase
      .from("contracts")
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
      .select()
      .single();

    setAddingContract(false);
    if (error) alert("Error adding contract: " + error.message);
    else {
      // === THIS IS THE MISSING LINE! ===
      if (data && data.id) {
        await supabase.rpc('generate_rent_receivables', { contract_id: data.id });
      }
      setContractForm({
        property_id: "",
        unit_id: "",
        client_id: "",
        contract_start: "",
        contract_end: "",
        rent_amount: "",
        payment_frequency: "monthly",
        security_deposit: "",
      });
      fetchContracts();
    }
  }
};


  const handleEditContract = (ctr) => {
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
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to delete this contract?")) return;
    const { error } = await supabase.from("contracts").delete().eq("id", contractId);
    if (error) {
      alert("Error deleting contract: " + error.message);
    } else {
      if (editingContract && editingContract.id === contractId) {
        setEditingContract(null);
        setContractForm({
          property_id: "",
          unit_id: "",
          client_id: "",
          contract_start: "",
          contract_end: "",
          rent_amount: "",
          payment_frequency: "monthly",
          security_deposit: "",
        });
      }
      fetchContracts();
    }
  };

  const handleCancelEditContract = () => {
    setEditingContract(null);
    setContractForm({
      property_id: "",
      unit_id: "",
      client_id: "",
      contract_start: "",
      contract_end: "",
      rent_amount: "",
      payment_frequency: "monthly",
      security_deposit: "",
    });
  };

  // ===== Lease & Rent Payment Handlers =====
  const handleShowLeaseSchedule = (propertyId) => {
    if (selectedLeasePropertyId === propertyId) {
      setSelectedLeasePropertyId(null);
      setLeasePayments([]);
    } else {
      setSelectedLeasePropertyId(propertyId);
      fetchLeasePayments(propertyId);
    }
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

  const handleShowRentReceivables = async (contractId) => {
    fetchRentReceivables(contractId);
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

  const undoPaidRentReceivable = async (rentId) => {
    const { error } = await supabase
      .from('rent_receivables')
      .update({ status: 'pending', paid_at: null, paid_date: null, amount_paid: 0 })
      .eq('id', rentId);
    if (error) {
      alert('Error undoing paid: ' + error.message);
    } else {
      setRentReceivables(rentReceivables.map(r =>
        r.id === rentId ? { ...r, status: 'pending', paid_at: null, paid_date: null, amount_paid: 0 } : r
      ));
    }
  };

  // ========== FINAL RENDER IN NEXT CHUNK ==========
  // ========== FINAL RENDER ==========

  return (
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
      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        style={{
          marginBottom: 16,
          gridColumn: "1 / span 3",
          justifySelf: "end",
          background: "#0cf",
          color: "#fff",
          border: "none",
          borderRadius: 3,
          padding: "4px 14px",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        {i18n.language === "en" ? "العربية" : "English"}
      </button>

      {/* PROPERTIES CARD */}
      <div className="glass-card">
        <h2 style={{ marginBottom: 24 }}>{t('properties', 'Properties')}</h2>
        <PropertyForm
          form={form}
          editingProperty={editingProperty}
          adding={adding}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancelEdit}
          paymentFrequencyOptions={[
            { value: "monthly", label: t("monthly", "Monthly") },
            { value: "quarterly", label: t("quarterly", "Quarterly") },
            { value: "half-yearly", label: t("half-yearly", "Half-Yearly") },
            { value: "yearly", label: t("yearly", "Yearly") }
          ]}
        />
        <button
          onClick={() => setShowPropertiesList((show) => !show)}
          style={{
            marginBottom: 12,
            background: "#0cf",
            color: "#fff",
            border: "none",
            borderRadius: 3,
            padding: "4px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showPropertiesList
            ? t('hide_list', { list: t('properties', 'Properties') })
            : t('show_list', { list: t('properties', 'Properties') })}
        </button>
        {showPropertiesList && (
          <>
            <PropertiesList
              properties={properties}
              loading={loading}
              expandedPropertyId={expandedPropertyId}
              onExpandProperty={setExpandedPropertyId}
              onEditProperty={handleEditProperty}
              onDeleteProperty={handleDeleteProperty}
              onShowLeaseSchedule={handleShowLeaseSchedule}
              renderUnitsForProperty={(propertyId) =>
                expandedPropertyId === propertyId && (
                  <>
                    <UnitForm
                      unitForm={unitForm}
                      editingUnit={editingUnit}
                      addingUnit={addingUnit}
                      onChange={handleUnitChange}
                      onSubmit={handleUnitSubmit}
                      onCancel={handleCancelEditUnit}
                    />
                    <UnitsList
                      units={units}
                      loadingUnits={loadingUnits}
                      onEditUnit={handleEditUnit}
                      onDeleteUnit={handleDeleteUnit}
                    />
                  </>
                )
              }
              t={t}
            />

            {/* LEASE SCHEDULE TABLE */}
            {selectedLeasePropertyId && (
              <div style={{ gridColumn: "1 / span 3", marginTop: 20 }}>
                <h3>
                  Lease Schedule for:{" "}
                  {properties.find((p) => p.id === selectedLeasePropertyId)?.property_name}
                </h3>
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
                    {leasePayments.map((lp) => (
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
              </div>
            )}
          </>
        )}
      </div>

      {/* CLIENTS CARD */}
      <div className="glass-card">
        <h2>{t('clients', 'Clients')}</h2>
        <ClientForm
          clientForm={clientForm}
          editingClient={editingClient}
          addingClient={addingClient}
          onChange={handleClientChange}
          onSubmit={handleClientSubmit}
          onCancel={handleCancelEditClient}
        />
        <button
          onClick={() => setShowClientsList((show) => !show)}
          style={{
            marginBottom: 12,
            background: "#0cf",
            color: "#fff",
            border: "none",
            borderRadius: 3,
            padding: "4px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showClientsList
            ? t('hide_list', { list: t('clients', 'Clients') })
            : t('show_list', { list: t('clients', 'Clients') })}
        </button>
        {showClientsList && (
          <ClientsList
            clients={clients}
            loadingClients={loadingClients}
            expandedClientId={expandedClientId}
            onExpandClient={setExpandedClientId}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
          />
        )}
      </div>

      {/* CONTRACTS CARD */}
      <div className="glass-card">
        <h2>{t('contracts', 'Contracts')}</h2>
        <ContractForm
          contractForm={contractForm}
          editingContract={editingContract}
          addingContract={addingContract}
          properties={properties}
          // Only show units for current property, and only vacant or currently-selected unit (when editing)
          units={units.filter(
            u =>
              u.property_id === contractForm.property_id &&
              (u.status === "vacant" || u.id === contractForm.unit_id)
          )}
          clients={clients}
          onChange={handleContractChange}
          onSubmit={handleContractSubmit}
          onCancel={handleCancelEditContract}
        />
{showContractsList && (
  <ContractsList
    contracts={contracts}
    properties={properties}
    units={units}
    clients={clients}
    loadingContracts={loadingContracts}
    expandedContractId={expandedContractId}
    onExpandContract={setExpandedContractId}
    onEditContract={handleEditContract}
    onDeleteContract={handleDeleteContract}
    onShowRentReceivables={handleShowRentReceivables}
  />
)}

<button
  onClick={() => setShowContractsList(show => !show)}
  style={{
    marginBottom: 12,
    background: "#0cf",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    padding: "4px 14px",
    fontWeight: 600,
    cursor: "pointer",
  }}
>
  {showContractsList
    ? t('hide_list', { list: t('contracts', 'Contracts') })
    : t('show_list', { list: t('contracts', 'Contracts') })}
</button>

       
      </div>
    </div>
  );
}

// ==== VERSION TAG ====
export default Admin; // V11
