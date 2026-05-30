import { Boxes } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useVerification } from "../../state/verification";
import { countrySummary, shortId } from "../../lib/provenance";
import { SectionLabel, KV } from "../primitives";
import { productLink } from "../QrScan";

function openQr() {
  window.dispatchEvent(new Event("open-qr"));
}

export default function InspectorEmpty() {
  const { scenario, baseResult } = useVerification();
  const chain = scenario.chain;
  const atts = chain.attestations || [];
  const { byCountry, total } = countrySummary(chain, baseResult);
  const leaf = atts.find((a) => a.attestation_id === chain.product_attestation_id);

  return (
    <div className="p-4">
      <SectionLabel>Product</SectionLabel>
      <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
        <Boxes className="h-4 w-4 text-route" />
        {leaf?.output?.name || "Product"}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <KV k="leaf attestation" v={shortId(chain.product_attestation_id)} mono />
        <KV k="attestations" v={atts.length} mono />
        <KV k="countries" v={byCountry.length} mono />
        <KV k="total cost" v={`$${Math.round(total).toLocaleString()} CAD`} mono />
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-background/40 p-3">
        <div className="rounded bg-white p-1.5">
          <QRCodeSVG value={productLink(scenario.id)} size={58} level="M" />
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          The QR printed on this drone.{" "}
          <button onClick={openQr} className="text-route hover:underline">Scan another</button> to verify a different unit.
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
        Select a country on the map, a step in the chain graph, or a finding — its details appear here.
      </div>
    </div>
  );
}
