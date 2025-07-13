import React from "react";

function UnitForm({
  unitForm,
  editingUnit,
  addingUnit,
  onChange,
  onSubmit,
  onCancel
}) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
      <h4>{editingUnit ? "Edit Unit" : "Add Unit/Space to Property"}</h4>
      <input
        type="text"
        name="unit_name"
        placeholder="Unit Name (e.g. Shop 1)"
        value={unitForm.unit_name}
        onChange={onChange}
        required
      />
      <input
        type="text"
        name="unit_type"
        placeholder="Unit Type (shop, office, etc.)"
        value={unitForm.unit_type}
        onChange={onChange}
      />
      <input
        type="text"
        name="floor"
        placeholder="Floor (e.g. Ground, 1st)"
        value={unitForm.floor}
        onChange={onChange}
      />
      <input
        type="number"
        name="size_sq_m"
        placeholder="Size (sq. meters)"
        value={unitForm.size_sq_m}
        onChange={onChange}
        min="0"
        step="0.01"
      />
      <select
        name="status"
        value={unitForm.status}
        onChange={onChange}
      >
        <option value="vacant">Vacant</option>
        <option value="occupied">Occupied</option>
      </select>
      <button type="submit" disabled={addingUnit}>
        {addingUnit ? 'Saving...' : editingUnit ? 'Update Unit' : 'Add Unit'}
      </button>
      {editingUnit && (
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

export default UnitForm;
