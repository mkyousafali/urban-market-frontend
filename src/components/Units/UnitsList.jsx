import React from "react";

function UnitsList({
  units,
  loadingUnits,
  onEditUnit,
  onDeleteUnit
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h4>Units for Selected Property</h4>
      {loadingUnits && <p>Loading units...</p>}
      {!loadingUnits && units.length === 0 && <p>No units found for this property.</p>}
      <ul>
        {units.map((u) => (
          <li key={u.id} className="list-card">
            <strong>{u.unit_name}</strong>
            {u.unit_type && <> | Type: {u.unit_type}</>}
            {u.floor && <> | Floor: {u.floor}</>}
            {u.size_sq_m && <> | Size: {u.size_sq_m} m²</>}
            {u.status && <> | Status: {u.status}</>}
            <br />
            <button
              style={{ marginTop: 4, marginRight: 8 }}
              onClick={() => onEditUnit(u)}
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
                marginRight: 8
              }}
              onClick={() => onDeleteUnit(u.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UnitsList;
