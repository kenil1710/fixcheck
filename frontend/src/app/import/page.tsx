import type { Metadata } from "next";
import { ImportFlow } from "./ImportFlow";

export const metadata: Metadata = { title: "Import a report", description: "Open a whole-report scorecard: every finding of a pinned Sherlock or Code4rena report, enumerated by code." };

export default function ImportPage() {
  return (
    <div className="pt-12">
      <h1 className="t-h1">Import a whole report</h1>
      <p className="t-lede mt-3 max-w-[64ch]">Paste a pinned audit report and the protocol&apos;s pinned docs. The contract reads every finding and the auditor&apos;s own status for each; you don&apos;t choose any. Findings marked fixed become slots that anyone can file checks into until the filing deadline. A report that can&apos;t be read completely is refused whole.</p>
      <ImportFlow />
    </div>
  );
}
