import React, { useState } from 'react';
import { ArrowLeft, Printer, X, FileText, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getDoc, LEGAL_DOCS, LegalDoc } from './legalDocs';

interface LegalViewerModalProps {
  initialDocId?: string;
  onClose: () => void;
}

/**
 * Full in-app legal document reader. Renders documents directly in the app so
 * no external navigation is needed. Shows the document list first unless a
 * specific document is requested.
 */
export const LegalViewerModal: React.FC<LegalViewerModalProps> = ({ initialDocId, onClose }) => {
  const [openDocId, setOpenDocId] = useState<string | null>(initialDocId ?? null);
  const doc = openDocId ? getDoc(openDocId) : undefined;

  return (
    <div className="fixed inset-0 z-[100] bg-ink-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-3xl h-[95vh] sm:h-[90vh] bg-ink-50 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col rise-in">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {openDocId && (
              <button
                onClick={() => setOpenDocId(null)}
                title="Back to all documents"
                className="p-2 -ml-2 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ink-900 truncate">
                {doc ? doc.title : 'Legal & Policies'}
              </p>
              <p className="text-[10px] text-ink-400 font-semibold truncate">
                {doc ? `Version ${doc.version} — effective ${doc.updated}` : 'ChangeTrack — Powered by Future Pulse Investments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {doc && (
              <button
                onClick={() => window.print()}
                title="Print or save as PDF"
                className="p-2.5 text-ink-500 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="p-2.5 text-ink-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {doc ? <DocBody doc={doc} /> : <DocList onOpen={setOpenDocId} />}
        </div>
      </div>
    </div>
  );
};

const DocList: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const customerDocs = LEGAL_DOCS.filter(d => d.audience === 'customer');
  const internalDocs = LEGAL_DOCS.filter(d => d.audience === 'internal');

  const renderList = (docs: LegalDoc[], internal: boolean) => (
    <div className="space-y-2.5">
      {docs.map(d => (
        <button
          key={d.id}
          onClick={() => onOpen(d.id)}
          className="w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-md shadow-sm transition-all tap-scale"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${internal ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
            {internal ? <Lock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink-900 leading-snug">{d.title}</p>
            <p className="text-xs text-ink-400 mt-0.5">Version {d.version} — updated {d.updated}</p>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-600/25">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Legal & Policies</h1>
          <p className="text-xs text-ink-400 font-semibold">ChangeTrack — Powered by Future Pulse Investments</p>
        </div>
      </div>

      <h2 className="text-xs font-extrabold text-ink-500 uppercase tracking-wide mb-3">Customer documents</h2>
      {renderList(customerDocs, false)}

      <h2 className="text-xs font-extrabold text-ink-500 uppercase tracking-wide mt-7 mb-3">Internal (administrators only)</h2>
      {renderList(internalDocs, true)}

      <p className="mt-7 text-xs text-ink-400 leading-relaxed">
        These documents are provided for information and recordkeeping. They do not constitute legal advice and are not
        legally certified. Provisions marked for review should be checked by a qualified Zimbabwean legal professional
        before commercial use.
      </p>
    </div>
  );
};

const DocBody: React.FC<{ doc: LegalDoc }> = ({ doc }) => (
  <article>
    {doc.audience === 'internal' && (
      <div className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Internal document — authorised administrators of Future Pulse Investments only.</span>
      </div>
    )}

    <p className="text-sm text-ink-500 leading-relaxed mb-6 pb-5 border-b border-slate-200">{doc.intro}</p>

    {doc.sections.length > 4 && (
      <nav className="mb-7 p-4 rounded-2xl bg-slate-100/80 border border-slate-200">
        <p className="text-xs font-extrabold text-ink-500 uppercase tracking-wide mb-2">Contents</p>
        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
          {doc.sections.map(sec => (
            <li key={sec.heading}>
              <button
                onClick={() => {
                  const el = document.getElementById(modalSlug(sec.heading));
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-left text-xs text-brand-700 hover:text-brand-800 hover:underline underline-offset-2 leading-relaxed"
              >
                {sec.heading}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    )}

    <div className="space-y-6">
      {doc.sections.map(sec => (
        <section key={sec.heading} id={modalSlug(sec.heading)} className="scroll-mt-4">
          <h2 className="text-base font-extrabold text-ink-900 mb-2.5">{sec.heading}</h2>
          {sec.paragraphs?.map((p, i) => (
            <p key={i} className="text-sm text-ink-700 leading-relaxed mb-2">{p}</p>
          ))}
          {sec.bullets && (
            <ul className="space-y-1.5 mt-1">
              {sec.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {sec.reviewNote && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-100 border border-slate-200 p-2.5 text-xs text-slate-600">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{sec.reviewNote}</span>
            </div>
          )}
        </section>
      ))}
    </div>

    <p className="mt-9 pt-5 border-t border-slate-200 text-xs text-ink-400 text-center">
      ChangeTrack — Powered by Future Pulse Investments
    </p>
  </article>
);

// Prefix avoids clashing with element IDs elsewhere on the page.
function modalSlug(heading: string): string {
  return `legal-modal-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}
