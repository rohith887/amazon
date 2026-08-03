import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { SelectField, TextField } from "../../components/ui/Field.jsx";
import { Toggle } from "../../components/ui/Toggle.jsx";

const COLUMNS = [
  { key: "teamLeaderName", header: "Team Leader Name" },
  { key: "userName", header: "User Name" },
  { key: "alias", header: "Alias" },
  { key: "sipId", header: "SIP ID" },
  { key: "empId", header: "Emp ID" },
  { key: "email", header: "Email ID" },
  { key: "lobActivity", header: "LOB (Activity)" },
  { key: "fetchStrategy", header: "Fetch Strategy" },
  {
    key: "enabled",
    header: "Enabled",
    sortValue: (r) => (r.enabled ? 1 : 0),
    render: (r) => <Badge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "Active" : "InActive"}</Badge>,
  },
  {
    key: "role",
    header: "Roles (Location)",
    sortValue: (r) => r.role,
    render: (r) => `${r.role} (${r.location})`,
  },
];

const EMPTY_FORM = {
  teamLeaderName: "",
  userName: "",
  alias: "",
  sipId: "",
  empId: "",
  email: "",
  lobActivity: "",
  fetchStrategy: "random",
  enabled: true,
  role: "agent",
  location: "",
};

const ROLE_OPTIONS = ["agent", "team_leader", "trainer", "admin"].map((r) => ({ label: r, value: r }));

const STRATEGY_OPTIONS = ["random", "round-robin", "priority"].map((s) => ({ label: s, value: s }));

export default function UserDetails() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | user object
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function loadUsers() {
    setLoading(true);
    api
      .get("/report/users")
      .then((users) =>
        setRows(
          users.map((u) => ({
            id: u.id,
            teamLeaderName: u.teamLeaderName,
            userName: u.userName,
            alias: u.alias,
            sipId: u.sipId,
            empId: u.empId,
            email: u.email,
            lobActivity: u.lobActivity,
            fetchStrategy: u.fetchStrategy,
            enabled: u.enabled,
            role: u.role,
            location: u.location,
          })),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing("new");
    setMessage("");
  }

  function openEdit(user) {
    setForm({
      teamLeaderName: user.teamLeaderName ?? "",
      userName: user.userName ?? "",
      alias: user.alias ?? "",
      sipId: user.sipId ?? "",
      empId: user.empId ?? "",
      email: user.email ?? "",
      lobActivity: user.lobActivity ?? "",
      fetchStrategy: user.fetchStrategy ?? "random",
      enabled: Boolean(user.enabled),
      role: user.role ?? "agent",
      location: user.location ?? "",
    });
    setEditing(user);
    setMessage("");
  }

  function patch(p) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function handleSubmit() {
    if (saving || !form.userName || !form.email) return;
    setSaving(true);
    setMessage("");
    try {
      if (editing === "new") {
        await api.post("/report/users", form);
      } else {
        await api.patch(`/report/users/${editing.id}`, form);
      }
      setMessage("User saved.");
      setEditing(null);
      loadUsers();
    } catch (err) {
      setMessage(err?.message ?? "Failed to save user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Users Details"
        actions={[
          <Button key="list" label="List Users" variant="secondary" size="sm" onClick={() => setEditing(null)} />,
          <Button key="add" label="Add New User" variant="success" size="sm" onClick={openNew} />,
        ]}
      />
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <TextField label="Team Leader Name" value={form.teamLeaderName} onChange={(v) => patch({ teamLeaderName: v })} />
            <TextField label="User Name *" value={form.userName} onChange={(v) => patch({ userName: v })} />
            <TextField label="Alias" value={form.alias} onChange={(v) => patch({ alias: v })} />
            <TextField label="SIP ID" value={form.sipId} onChange={(v) => patch({ sipId: v })} />
            <TextField label="Emp ID" value={form.empId} onChange={(v) => patch({ empId: v })} />
            <TextField label="Email ID *" value={form.email} onChange={(v) => patch({ email: v })} />
            <TextField label="LOB (Activity)" value={form.lobActivity} onChange={(v) => patch({ lobActivity: v })} />
            <SelectField label="Fetch Strategy" options={STRATEGY_OPTIONS} value={form.fetchStrategy} onChange={(v) => patch({ fetchStrategy: v })} />
            <SelectField label="Role" options={ROLE_OPTIONS} value={form.role} onChange={(v) => patch({ role: v })} />
            <TextField label="Location" value={form.location} onChange={(v) => patch({ location: v })} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Toggle checked={form.enabled} onChange={(v) => patch({ enabled: v })} />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Enabled</span>
            </div>
          </div>
          {message ? <p style={{ fontSize: "13px", color: "var(--success-500)" }}>{message}</p> : null}
          <div style={{ display: "flex", gap: "12px" }}>
            <Button label={saving ? "Saving…" : "Save"} onClick={handleSubmit} disabled={saving} />
            <Button label="Cancel" variant="secondary" onClick={() => setEditing(null)} />
          </div>
        </div>
      ) : null}
      <DataTable
        columns={[
          ...COLUMNS,
          { key: "_actions", header: "", render: (r) => <Button label="Edit" variant="secondary" size="sm" onClick={() => openEdit(r)} /> },
        ]}
        rows={rows}
        loading={loading}
        exportFileName="user-details"
      />
    </Card>
  );
}
