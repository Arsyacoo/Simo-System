export function serializeRole(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  };
}

export function serializeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.role_id,
    roleName: row.role_name,
    site: row.site,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export function serializeProject(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client_name,
    clientName: row.client_name,
    location: row.location,
    status: row.status,
    dueDate: row.due_date,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

export function serializeWarehouse(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    name: row.name,
    location: row.location,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function serializeWorkItem(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    warehouseId: row.warehouse_id,
    taskName: row.name,
    name: row.name,
    category: row.category,
    materialName: row.material_name,
    quantity: row.quantity,
    unit: row.unit,
    status: row.status,
    progressWeight: row.progress_weight,
    qcStatus: row.qc_status,
    readyToShip: Boolean(row.ready_to_ship),
    updatedAt: row.updated_at,
  };
}

export function serializeQcChecklist(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    warehouseId: row.warehouse_id,
    workItemId: row.work_item_id,
    materialName: row.material_name,
    length: row.length,
    width: row.width,
    thickness: row.thickness,
    qcStatus: row.qc_status,
    notes: row.notes,
    evidencePhoto: row.evidence_photo_reference,
    evidencePhotoReference: row.evidence_photo_reference,
    inspectorUserId: row.inspector_user_id,
    createdBy: row.inspector_name,
    createdByRole: row.inspector_role,
    createdAt: row.created_at,
  };
}

export function serializeAuditLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.user_name,
    userName: row.user_name,
    role: row.role_name,
    roleName: row.role_name,
    module: row.module,
    actionType: row.action_type,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    table: row.table_name,
    recordId: row.entity_id,
    previousValue: row.previous_value,
    newValue: row.new_value,
    description: row.description,
    timestamp: row.created_at,
    createdAt: row.created_at,
  };
}
