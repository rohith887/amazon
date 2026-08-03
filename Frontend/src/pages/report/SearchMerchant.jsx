import { useState } from "react";
import { api, ApiError } from "../../api/client.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { TextField } from "../../components/ui/Field.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { formatDateTime } from "../../utils/date.js";

function DetailItem({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: "12px", color: "var(--ink-500)", margin: "0 0 2px" }}>{label}</p>
      <p style={{ fontSize: "13.5px", fontWeight: "500", color: "var(--ink-900)", margin: "0" }}>{value}</p>
    </div>
  );
}

export default function SearchMerchant() {
  const [merchantId, setMerchantId] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canSearch = merchantId.trim().length > 0;

  async function handleSearch() {
    const id = merchantId.trim();
    if (!id || searching) return;
    setSearching(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.get(`/report/merchant/${encodeURIComponent(id)}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No merchant found with that ID.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader title="Merchant Details and Interactions" />
        <CardBody>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "280px", width: "100%" }}>
              <TextField
                label="Merchant ID"
                placeholder="e.g. 8413218735"
                value={merchantId}
                onChange={setMerchantId}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
            <Button label={searching ? "Searching…" : "Search Merchant"} disabled={!canSearch || searching} onClick={handleSearch} />
          </div>
        </CardBody>
      </Card>

      <div>
        {error ? (
          <Card>
            <EmptyState title={error} />
          </Card>
        ) : null}

        {result ? (
          <Card>
            <CardHeader title={`Merchant ${result.merchantId}`} />
            <div className="form-grid">
              <DetailItem label="Merchant Name" value={result.merchantName} />
              <DetailItem label="LOB" value={result.lob} />
              <DetailItem label="Activity" value={result.activity} />
              <DetailItem label="Phone" value={result.phone} />
            </div>
            <DataTable
              columns={[
                { key: "date", header: "Date", render: (r) => formatDateTime(r.date) },
                { key: "advisor", header: "Advisor" },
                { key: "activity", header: "Activity" },
                { key: "disposition", header: "Disposition" },
                { key: "remarks", header: "Remarks" },
              ]}
              rows={result.interactions}
              exportFileName={`merchant-${result.merchantId}`}
            />
          </Card>
        ) : null}
      </div>
    </>
  );
}
