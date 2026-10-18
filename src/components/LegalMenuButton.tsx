import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { LegalViewerModal } from '../legal/LegalViewerModal';

/**
 * Navbar button that opens the in-app legal document reader. Renders the
 * reader inside this component so no routing or new-tab navigation happens.
 */
export const LegalMenuButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Legal & Policies"
        className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
      >
        <ShieldCheck className="w-4 h-4" />
      </button>
      {open && <LegalViewerModal onClose={() => setOpen(false)} />}
    </>
  );
};
