import React from "react";

function ClientsList({
  clients,
  loadingClients,
  expandedClientId,
  onExpandClient,
  onEditClient,
  onDeleteClient
}) {
  return (
    <div>
      <h4>All Clients</h4>
      {loadingClients && <p>Loading clients...</p>}
      {!loadingClients && clients.length === 0 && <p>No clients found.</p>}
      <ul>
        {clients.map((c) => (
          <li key={c.id} className="list-card">
            <strong>{c.client_name}</strong>
            <button
              style={{
                marginLeft: 12,
                background: expandedClientId === c.id ? "#444" : "#0cf",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                padding: "2px 8px",
                cursor: "pointer",
              }}
              onClick={() =>
                onExpandClient(expandedClientId === c.id ? null : c.id)
              }
            >
              {expandedClientId === c.id ? "Hide Details" : "Show Details"}
            </button>
            {expandedClientId === c.id && (
              <div style={{ marginLeft: 12, marginTop: 8 }}>
                {c.contact_person && <>Contact: {c.contact_person}<br /></>}
                {c.contact_phone && <>Phone: {c.contact_phone}<br /></>}
                {c.contact_email && <>Email: {c.contact_email}<br /></>}
                {c.whatsapp_number && <>WhatsApp: {c.whatsapp_number}<br /></>}
                {c.address && <>Address: {c.address}<br /></>}
                <button
                  style={{ marginTop: 4, marginRight: 8 }}
                  onClick={() => onEditClient(c)}
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
                  onClick={() => onDeleteClient(c.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClientsList;
