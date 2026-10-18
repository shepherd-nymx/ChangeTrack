import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { ShopSubscription } from '../services/subscription';

interface BannerProps {
  subscription: ShopSubscription;
}

export const SubscriptionExpiryBanner: React.FC<BannerProps> = ({ subscription }) => {
  const end = new Date(subscription.periodEnd).getTime();
  const days = Math.max(0, Math.ceil((end - Date.now()) / 864e5));
  const fee = `${subscription.currency} ${subscription.monthlyFee.toFixed(2)}`;
  const isToday = end - Date.now() <= 864e5 && end > Date.now();

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 pt-3">
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3.5 rise-in ${
          isToday
            ? 'bg-rose-50 border-rose-300'
            : 'bg-amber-50 border-amber-300'
        }`}
        role="alert"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isToday ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isToday ? <Clock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${isToday ? 'text-rose-800' : 'text-amber-800'}`}>
            {isToday
              ? 'Your subscription ends today — the portal will pause after today.'
              : `Your subscription expires in ${days} day${days === 1 ? '' : 's'}.`}
          </p>
          <p className={`text-xs mt-0.5 ${isToday ? 'text-rose-700' : 'text-amber-700'}`}>
            Pay the monthly fee of <span className="font-bold">{fee}</span> to the administrator to receive your renewal key before the portal locks.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">
          ends {new Date(subscription.periodEnd).toLocaleString()}
        </span>
      </div>
    </div>
  );
};
