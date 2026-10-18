import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getDoc } from './legalDocs';

export const LegalDocViewer: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const doc = docId ? getDoc(docId) : undefined;

  if (!doc) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
        <div className="surface-card p-8 text-center max-w-md">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-3" />
          <h1 className="text-lg font-extrabold text-ink-900 mb-2">Document not found</h1>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 font-sans antialiased">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-ink-600 hover:text-ink-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-ink-700 hover:bg-slate-50 shadow-sm tap-scale"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        {doc.audience === 'internal' && (
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm text-amber-800 print:hidden">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Internal document — authorised administrators of Future Pulse Investments only.</span>
          </div>
        )}

        <article className="surface-card p-6 sm:p-10 print:p-0 print:shadow-none print:bg-white">
          <header className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-sm font-extrabold text-ink-900">ChangeTrack</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 tracking-tight leading-tight">{doc.title}</h1>
            <p className="mt-2 text-xs font-semibold text-ink-400 uppercase tracking-wide">
              Version {doc.version} — updated {doc.updated}
            </p>
            <p className="mt-4 text-sm text-ink-500 leading-relaxed">{doc.intro}</p>
            <p className="mt-4 text-xs text-ink-400">ChangeTrack — Powered by Future Pulse Investments</p>
          </header>

          <div className="space-y-7">
            {doc.sections.map(sec => (
              <section key={sec.heading}>
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

          <footer className="mt-10 pt-5 border-t border-slate-200 text-xs text-ink-400 text-center">
            ChangeTrack — Powered by Future Pulse Investments
          </footer>
        </article>
      </div>
    </div>
  );
};
