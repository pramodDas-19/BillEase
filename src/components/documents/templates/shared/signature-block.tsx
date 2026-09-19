import React from "react";
import { NormalizedDocument } from "./template-adapter";

interface SignatureBlockProps {
  doc: NormalizedDocument;
  compact?: boolean;
}

export function SignatureBlock({ doc, compact = false }: SignatureBlockProps) {
  const businessName = doc.tenant.businessName || "Authorized Signatory";
  const signatureUrl = doc.tenant.signatureUrl;

  return (
    <div className={`flex flex-col items-center justify-end text-center ${compact ? "min-w-[130px]" : "min-w-[170px]"}`}>
      <div className={`w-full flex items-center justify-center ${compact ? "h-10" : "h-14"} border-b border-slate-400 mb-1`}>
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Digital Signature"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-[9px] text-slate-300 italic font-mono">Sign Here</span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-900 leading-tight">
        For {businessName}
      </p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">
        Authorised Signatory
      </p>
    </div>
  );
}
