// Versioned legal and operational documents for ChangeTrack.
// Owned by Future Pulse Investments, Zimbabwe.
//
// PLACEHOLDER convention: text in [SQUARE BRACKETS] is information the owner
// must supply before commercial use. Do not remove the brackets until the
// value is confirmed.
//
// NOTE: These documents are a starting point drafted for Zimbabwean context.
// They are NOT a substitute for review by a qualified Zimbabwean legal
// professional. Provisions flagged "LEGAL REVIEW" especially require it.

export interface DocSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  reviewNote?: string;
}

export interface LegalDoc {
  id: string;
  title: string;
  version: string;
  updated: string;
  audience: 'customer' | 'internal';
  intro: string;
  sections: DocSection[];
}

const COMPANY = 'Future Pulse Investments';
const JURISDICTION = 'Zimbabwe';

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'terms',
    title: 'Terms of Service and Software Usage Agreement',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `These Terms govern your use of ChangeTrack, a retail outstanding-change recordkeeping platform owned and operated by ${COMPANY}, ${JURISDICTION}. By registering a shop account or using ChangeTrack, you agree to these Terms.`,
    sections: [
      {
        heading: '1. Permitted Use',
        paragraphs: [
          'ChangeTrack is licensed to you as a recordkeeping tool for tracking outstanding customer change, generating Change IDs, recording collection status, and preparing WhatsApp confirmation messages.',
          'You may use ChangeTrack only for lawful retail recordkeeping within the business entity registered on your account.'
        ]
      },
      {
        heading: '2. Account Responsibilities',
        bullets: [
          'You are responsible for all activity carried out under your account credentials.',
          'You must keep your password confidential and use a strong, unique password.',
          'You must provide accurate information when registering your shop.',
          'You must promptly report any unauthorised access to your account.'
        ]
      },
      {
        heading: '3. Ownership and Intellectual Property',
        paragraphs: [
          `ChangeTrack, including its source code, design, underlying platform, reusable components, trademarks, and all related intellectual property, is and remains the property of ${COMPANY}.`,
          'Your registration grants you a non-exclusive, non-transferable right to use the platform in accordance with these Terms and your purchase or service agreement. It does not transfer ownership of any part of the software.',
          'A separate signed Software Licence and Ownership Agreement governs the exact licence you purchase. See the "Software Licence and Ownership Agreement" document for details.'
        ]
      },
      {
        heading: '4. Prohibited Activities',
        bullets: [
          'Copying, modifying, reverse engineering, or creating derivative works of the software.',
          'Reselling, sublicensing, or providing ChangeTrack to third parties as a service without written permission.',
          'Attempting to access other customers\' data, systems, or accounts.',
          'Using the platform for fraud, money laundering, or any unlawful activity.',
          'Interfering with the security or availability of the service.'
        ]
      },
      {
        heading: '5. User-Generated Data',
        paragraphs: [
          'You remain the owner of the records you enter (customer names, phone numbers, amounts, notes, and collection instructions). You are responsible for the accuracy of those records and for complying with applicable law when entering personal information about your customers.',
          'We may process your records only as needed to operate and support the service. See our Privacy Policy.'
        ]
      },
      {
        heading: '6. Account Suspension and Termination',
        paragraphs: [
          'We may suspend or terminate your account if you breach these Terms, fail to pay amounts due, or use the service in a way that creates legal or security risk.',
          'Where practical, we will give notice and a reasonable opportunity to remedy the breach before suspension.',
          'You may stop using ChangeTrack at any time. On termination, see the data export provisions in the Maintenance and Support Agreement and the Privacy Policy.'
        ]
      },
      {
        heading: '7. Limitation of Liability',
        reviewNote:
          'LEGAL REVIEW: liability caps and exclusions must be checked against the Consumer Protection Act [Chapter 14:14] and Zimbabwean contract law.',
        paragraphs: [
          'ChangeTrack is a recordkeeping tool. It is not a bank, payment processor, or guarantor that outstanding amounts will be collected.',
          'To the maximum extent permitted by law, ${COMPANY} is not liable for indirect, incidental, or consequential losses, including lost profits, lost change, or business interruption arising from use of the platform.',
          'Nothing in these Terms excludes liability that cannot lawfully be excluded.'
        ]
      },
      {
        heading: '8. Dispute Resolution',
        paragraphs: [
          'Parties should first attempt to resolve any dispute informally by contacting support.',
          'If informal resolution fails, disputes will be addressed under the laws of Zimbabwe, in the courts or arbitration forum agreed in your purchase or service agreement.'
        ]
      },
      {
        heading: '9. Governing Law',
        paragraphs: [
          'These Terms are governed by the laws of Zimbabwe.'
        ]
      },
      {
        heading: '10. Changes to These Terms',
        paragraphs: [
          'We may update these Terms. Where changes are material, we will ask you to review and re-accept before continued use. The current version number is shown at the top of this document and recorded with your acceptance.'
        ]
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `This Privacy Policy explains what data ChangeTrack collects, why, how it is stored and protected, and the rights you have. It reflects the actual implementation of the platform and is intended to align with the Zimbabwean Cyber and Data Protection Act [Chapter 12:07].`,
    sections: [
      {
        heading: '1. Data We Collect',
        bullets: [
          'Account data: shop name and the email address used to register your account.',
          'Operational records you enter: customer names and phone numbers, amounts owed, Change IDs, dates and times, collection instructions, notes, and collection status.',
          'WhatsApp message text: the pre-filled confirmation messages the platform prepares for you.',
          'Legal acceptance records: the versions of the Terms of Service and Privacy Policy you accepted, the date and time of acceptance, and your device/browser user-agent string.',
          'Technical data: basic connection and error logs needed to run and secure the service.'
        ]
      },
      {
        heading: '2. Purposes of Processing',
        bullets: [
          'Providing the change-tracking service: recording, balancing, and marking change as collected.',
          'Generating Change IDs, QR collection codes, and pre-filled WhatsApp messages.',
          'Keeping an audit history to help resolve disputes.',
          'Enforcing legal acceptance of our Terms and Privacy Policy.',
          'Sending the one-time welcome email after registration.'
        ]
      },
      {
        heading: '3. Storage and Processing',
        paragraphs: [
          'Records are stored in a managed cloud database (Supabase, which runs on AWS infrastructure). Data is encrypted in transit using HTTPS/TLS. Each shop\'s data is isolated by database access rules so one customer cannot read another customer\'s records.',
          'Some basic portal data may also be cached locally on your own device to allow offline use.'
        ]
      },
      {
        heading: '4. Sharing of Data',
        bullets: [
          'We do not sell your data.',
          'Your operational records are visible only to your account and, where you choose, employees using your shop portal.',
          'Cloud infrastructure providers (hosting and database) process data on our behalf solely to deliver the service.',
          'We may disclose data where required by law or a valid order of a court or regulator.'
        ]
      },
      {
        heading: '5. Retention and Deletion',
        paragraphs: [
          'Records are kept for as long as your account is active, plus a reasonable period to allow dispute resolution.',
          'You may request deletion of your account and records. Some audit and acceptance records may be retained where required for legal compliance or legitimate dispute defence.',
          'Local device caches are cleared when you sign out or clear your browser data.'
        ]
      },
      {
        heading: '6. Security Measures',
        bullets: [
          'Transport encryption (HTTPS/TLS) for all communication with the cloud database.',
          'Row-level database access rules restricting every record to its owning account.',
          'Append-only audit logs and tamper-detection checks on change records.',
          'Credentials handled exclusively by the authentication provider; we never see or store your password.'
        ]
      },
      {
        heading: '7. Your Rights',
        reviewNote:
          'LEGAL REVIEW: confirm the full list of data subject rights under the Cyber and Data Protection Act [Chapter 12:07], including complaint routes to the Data Protection Authority (POTRAZ).',
        bullets: [
          'Request access to the personal data we hold about you.',
          'Request correction of inaccurate data.',
          'Request deletion of your data, subject to legal retention needs.',
          'Withdraw optional marketing consent at any time.',
          'Lodge a complaint with the Data Protection Authority if you believe your rights were infringed.'
        ]
      },
      {
        heading: '8. Third-Party Services',
        bullets: [
          'Supabase (database, authentication, and edge function hosting) — infrastructure provider.',
          'WhatsApp (via wa.me deep links) — messages are prepared by ChangeTrack and opened by you in WhatsApp; nothing is sent through the WhatsApp platform by us unless a separate agreement says otherwise.',
          'Google Fonts — standard web font delivery.',
          `[INSERT: list any additional third-party services you add, e.g. email delivery provider used by the welcome-email function.]`
        ]
      },
      {
        heading: '9. Contact',
        paragraphs: [
          `[INSERT: privacy contact — responsible person/role, email address, and postal address for ${COMPANY}.]`
        ]
      }
    ]
  },
  {
    id: 'refunds',
    title: 'Refund, Cancellation and Payment Policy',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `This policy explains how payments for ChangeTrack are handled, what happens on cancellation, and when a refund may be available. It applies to software licence fees, hosting costs, and maintenance charges billed by ${COMPANY}.`,
    sections: [
      {
        heading: '1. What You Are Paying For',
        bullets: [
          'Software licence / purchase fee: a one-time payment for the right to use ChangeTrack under your licence agreement. This covers the software itself as delivered.',
          'Hosting costs: recurring fees for cloud hosting of your portal and database, if included in your plan.',
          'Maintenance fees: recurring fees for bug fixes, security updates, and support under the Maintenance and Support Agreement.',
          'Enhancements and new features are separately quoted work, not covered by any of the above unless your agreement expressly says so.'
        ]
      },
      {
        heading: '2. Digital Delivery',
        paragraphs: [
          'ChangeTrack is delivered as an online service. Access is provisioned after receipt of the applicable fees. Because the product is digital and access is granted immediately, statutory or contractual cooling-off rights may be limited once access begins — this does not remove any mandatory consumer rights you have under Zimbabwean law.'
        ],
        reviewNote:
          'LEGAL REVIEW: confirm how digital-delivery rules interact with the Consumer Protection Act [Chapter 14:14] for your sales channels.'
      },
      {
        heading: '3. Cancellation',
        bullets: [
          'You may cancel recurring hosting or maintenance at the end of any billing period by giving written notice to support.',
          'Cancellation stops future billing; it does not by itself entitle you to a refund of fees already paid for the current period.',
          'Cancelling maintenance ends support, bug fixes, and security updates for your installation. Cancelling hosting may make your portal unavailable.'
        ]
      },
      {
        heading: '4. Failed Payments',
        bullets: [
          'If a payment fails, we will notify you and retry or hold provisioning until the account is settled.',
          'Continued non-payment may lead to suspension of access as described in the Terms of Service.'
        ]
      },
      {
        heading: '5. When a Refund May Be Available',
        bullets: [
          'Duplicate or incorrect charges (for example, being billed twice for the same period).',
          'A service that was never provisioned through our own fault.',
          'A paid enhancement that we failed to deliver as agreed.',
          'Any other circumstance where a refund is required by Zimbabwean law.'
        ],
        paragraphs: [
          'Refund requests should be sent in writing to support with proof of payment. Approved refunds are returned via the original payment method where possible.',
          'Refund timelines: [INSERT: your processing time, e.g. number of business days after approval.]'
        ]
      },
      {
        heading: '6. What Is Not Covered',
        paragraphs: [
          'Change of mind after access has been provisioned, unused portions of a billing period, and costs arising from third-party services (for example WhatsApp or internet connectivity) are not refundable unless the law requires otherwise. This policy does not limit mandatory consumer rights.'
        ]
      },
      {
        heading: '7. Contact',
        paragraphs: [
          `[INSERT: payments/billing contact — email address and any postal address.]`
        ]
      }
    ]
  },
  {
    id: 'licence',
    title: 'Software Licence and Ownership Agreement',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `This document explains what you receive when you purchase ChangeTrack. Unless a separate signed agreement expressly states otherwise, ${COMPANY} retains ownership of the software and grants you a licence to use it.`,
    sections: [
      {
        heading: '1. Licence, Not Ownership Transfer',
        paragraphs: [
          'Purchasing ChangeTrack does not transfer ownership of the software to you. You receive only the usage rights expressly granted in your signed purchase or service agreement.'
        ]
      },
      {
        heading: '2. What Future Pulse Investments Retains',
        bullets: [
          'All rights, title, and interest in the source code, object code, and underlying platform.',
          'Reusable components, libraries, and development tools used to build the platform.',
          'Trademarks, branding, documentation, and other intellectual property.'
        ]
      },
      {
        heading: '3. What the Customer Receives',
        bullets: [
          'A non-exclusive, non-transferable licence to use ChangeTrack for the internal recordkeeping of the business named in the agreement.',
          'The right to enter and manage that business\'s own customer change records.',
          'Any licence scope, term, and number of installations or users stated in the signed agreement.'
        ]
      },
      {
        heading: '4. Restrictions',
        bullets: [
          'No sublicensing, resale, or time-sharing of the software.',
          'No removal of branding, copyright notices, or license identifiers.',
          'No access to the software\'s source code except where a signed agreement expressly grants it.'
        ]
      },
      {
        heading: '5. Override by Signed Agreement',
        paragraphs: [
          'If ${COMPANY} signs a bespoke agreement with a customer that grants different rights (including source-code escrow, transfer of a customised installation, or extended usage rights), that signed agreement overrides this document to the extent of the conflict.'
        ]
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance and Support Agreement',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      'This document describes the maintenance and support that can be included with ChangeTrack. The exact plan, fees, and hours that apply to you are set in your signed purchase or service agreement.',
    sections: [
      {
        heading: '1. Included Maintenance',
        bullets: [
          'Fixes for defects ("bugs") that prevent the platform\'s core features from working as delivered.',
          'Security updates applied to the platform.',
          'Minor updates and corrections to documentation.',
          'Support via the agreed channels during the agreed support hours.'
        ]
      },
      {
        heading: '2. Support Channels, Hours, and Response Targets',
        bullets: [
          'Support channel: [INSERT: e.g. WhatsApp number, email address, or both.]',
          'Support hours: [INSERT: days and hours, e.g. Monday to Friday, 08:00 to 17:00 Central Africa Time.]',
          'Response target: [INSERT: e.g. we aim to acknowledge reports within one business day.] Targets are good-faith aims, not guarantees.',
          'Support is not provided 24/7, and no guaranteed uptime percentage is promised unless a separate signed agreement says so.'
        ]
      },
      {
        heading: '3. Customer Responsibilities',
        bullets: [
          'Reporting problems with enough detail to reproduce them (screenshots, Change IDs, times).',
          'Maintaining the security of their own account credentials and devices.',
          'Keeping their hosting and maintenance fees paid.',
          'Testing and confirming fixes on their own workflows before relying on them in production.'
        ]
      },
      {
        heading: '4. Paid Enhancements and Feature Requests',
        paragraphs: [
          'New features, customisations, integrations, and reports are enhancements, not maintenance. They are scoped and quoted separately. Feature requests are logged and prioritised by ${COMPANY}; submitting a request does not commit us to build it.'
        ]
      },
      {
        heading: '5. Third-Party Outages, Hosting, and Backups',
        bullets: [
          'The platform depends on third-party services (cloud hosting, database, WhatsApp, internet providers). Outages of those services are outside our control; we will assist with diagnosis and provider escalation.',
          'Hosting: [INSERT: who provides and pays for hosting — you or the customer.]',
          'Backups: [INSERT: backup schedule and who is responsible for verifying restoration.] Backups are a shared responsibility: customers should also export their own records periodically.'
        ]
      },
      {
        heading: '6. Data Recovery',
        paragraphs: [
          'Recovery from backups is performed only from the backups described in section 5. Changes made since the last backup cannot be recovered. We do not guarantee complete recovery of lost data.'
        ]
      },
      {
        heading: '7. Maintenance Charges',
        paragraphs: [
          'Maintenance is billed as [INSERT: monthly/annual fee, amount to be supplied by the owner] per the signed agreement. Work outside the included scope is quoted and approved before it starts.'
        ]
      },
      {
        heading: '8. Termination and Handover',
        bullets: [
          'Either party may end the maintenance agreement per the notice period in the signed agreement: [INSERT: notice period, e.g. 30 days.]',
          'On termination, we will provide available data exports in a common format (such as CSV) for the customer\'s own records, subject to fees being settled.',
          'Further handover arrangements (for example assisting a new service provider) are separately agreed.'
        ]
      },
      {
        heading: '9. Reporting a Bug, Requesting a Feature, or Requesting a Data Export',
        bullets: [
          'Bugs: send the details (what you did, what you expected, what happened) to the support channel in section 2.',
          'Features: describe the outcome you need and the workflow it supports; we will confirm whether it is an enhancement and provide a quote if so.',
          'Exports: request an export of your shop\'s records from support; we will confirm the format and delivery time.'
        ]
      }
    ]
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      'This policy sets out what you must not do when using ChangeTrack. It forms part of the Terms of Service.',
    sections: [
      {
        heading: '1. Prohibited Conduct',
        bullets: [
          'Unauthorised access to the platform, other accounts, or other customers\' data, including via automated tools or credential guessing.',
          'Fraud, including entering false records, misrepresenting collection status, or using Change IDs deceptively.',
          'Misuse of personal data: entering personal information about customers without a lawful basis, or extracting other customers\' data.',
          'Security attacks: scanning, probing, or testing the security of the service without written permission; injecting malicious code; attempting to bypass access controls.',
          'Unlawful activity of any kind, including money laundering and sanctions breaches.',
          'Abuse of the service: excessive automated load, attempts to disrupt availability, or reselling access without permission.'
        ]
      },
      {
        heading: '2. Reporting Violations',
        paragraphs: [
          `[INSERT: security/abuse contact, e.g. an email address for reporting suspected abuse or vulnerabilities.]`,
          'We may investigate suspected violations and may suspend accounts as provided in the Terms of Service.'
        ]
      }
    ]
  },
  {
    id: 'user-guide',
    title: 'Customer User Guide',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      'This guide explains how to use ChangeTrack day to day: registering, recording outstanding change, using Change IDs and QR codes, and keeping records correct.',
    sections: [
      {
        heading: '1. Registering and Signing In',
        bullets: [
          'Open the app and choose "Register your shop".',
          'Enter your shop name, email address, and a password of at least 6 characters.',
          'Tick the checkbox confirming you have read the Terms of Service and acknowledged the Privacy Policy. You can open both documents from the links next to the checkbox. Registration will not complete until this box is ticked.',
          'Optionally tick the separate marketing-consent box — this is optional and separate from the required acceptance.',
          'If email verification is enabled, check your inbox and confirm before signing in.'
        ]
      },
      {
        heading: '2. Recording Outstanding Change',
        bullets: [
          'In the Quick Till, enter the purchase total and the cash the customer handed over.',
          'The platform calculates the change. Choose "Record as Outstanding" to store it instead of paying it out.',
          'Enter the customer\'s name and phone number and any collection instructions (for example "collect within 30 days").',
          'The platform creates a unique Change ID and shows a confirmation you can share.'
        ]
      },
      {
        heading: '3. Using Change IDs, QR Codes, and WhatsApp',
        bullets: [
          'Each outstanding record has a unique Change ID (for example CT-20657). The customer should quote it or show their QR code.',
          'Use the digital pass link to open the customer\'s QR code on their phone; the cashier scans it to mark the change collected.',
          'Use the WhatsApp button to open WhatsApp with a pre-filled confirmation message. Check the message, then press send in WhatsApp yourself — ChangeTrack prepares the message but does not send it automatically.'
        ]
      },
      {
        heading: '4. Updating Collection Status',
        bullets: [
          'In the Admin Dashboard, find the customer\'s outstanding records.',
          'Select the record or records to pay out and confirm the collection. The platform updates the balance and records who collected.',
          'A collection confirmation message is prepared for WhatsApp sharing.'
        ]
      },
      {
        heading: '5. Correcting Errors',
        bullets: [
          'If you recorded wrong details, correct the record from the dashboard as soon as possible.',
          'Collections already recorded cannot be silently erased — corrections are logged so the audit history stays trustworthy.',
          'For anything you cannot fix yourself, contact support with the Change ID and what happened.'
        ]
      },
      {
        heading: '6. Contacting Support',
        paragraphs: [
          `[INSERT: support contact and hours, matching the Maintenance and Support Agreement.]`
        ]
      }
    ]
  },
  {
    id: 'admin-guide',
    title: 'Administrator and Maintenance Guide (Internal)',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'internal',
    intro:
      'INTERNAL DOCUMENT — for authorised administrators of Future Pulse Investments only. Not for distribution to shop customers. This guide covers deployment, administration, and offboarding for the ChangeTrack platform.',
    sections: [
      {
        heading: '1. Access Management',
        bullets: [
          'Shop accounts authenticate through the platform\'s managed authentication (email and password). Each shop row is bound to the account that registered it.',
          'Database access rules restrict every table to the owning account; users can only read and write their own shop\'s rows.',
          'Administrator-level work (migrations, provider dashboards, logs) must use individually-held accounts with the least privilege needed. Never share one admin login.',
          'Secrets and API keys are stored in the hosting provider\'s secret store and the deployment environment — never in the code, never in chat, never in this document.'
        ]
      },
      {
        heading: '2. Database Administration',
        bullets: [
          'Schema changes are applied as versioned migration files, in order, and are recorded by the provider. Never edit live data directly except through the app or a reviewed, logged query.',
          'Change records follow a strict state machine (outstanding → partially paid → collected). Verify any manual correction against the ledger so balances stay consistent.',
          'Audit logs and legal acceptance records are append-only: do not create update or delete paths for them.'
        ]
      },
      {
        heading: '3. Backups and Restoration',
        bullets: [
          '[INSERT: confirm the provider\'s automatic backup schedule and retention, and document any additional exports you take.]',
          'Test restoration on a schedule (for example quarterly) into a scratch environment; a backup that has never been restored is not a backup.',
          'Keep at least one recent export outside the primary provider as a safeguard.'
        ]
      },
      {
        heading: '4. Deployment',
        bullets: [
          'The frontend is a static build deployed to the hosting platform; each deploy replaces the previous build atomically.',
          'Run the production build locally before deploying to catch errors early.',
          'Cloud functions are deployed through the provider tooling; verify the function list after each deploy.',
          'Roll back by redeploying the previous known-good build.'
        ]
      },
      {
        heading: '5. Environment Variables and Configuration',
        bullets: [
          'The app reads its cloud endpoints and keys from environment variables configured in the hosting provider. Configure them there — never commit them to the repository.',
          'Commercial settings (licence fee, hosting cost, maintenance fee, support hours, payment terms) are configured as clearly marked placeholders in the legal documents and agreement template. Complete them before selling.',
          'Rotate any credential that may have been exposed, immediately.'
        ]
      },
      {
        heading: '6. Monitoring and Security',
        bullets: [
          '[INSERT: chosen monitoring approach — provider logs, uptime checks, error alerts.]',
          'Review authentication and database logs periodically for unusual access patterns.',
          'Apply security updates promptly; track provider advisories.',
          'Report suspected vulnerabilities through the contact in the Acceptable Use Policy.'
        ]
      },
      {
        heading: '7. Troubleshooting',
        bullets: [
          'Blank screen or failed deploy: reproduce the production build locally and read the first error, not the last.',
          'Customer cannot sign in: check whether email confirmation is pending before resetting credentials.',
          'Sync issues on a till: check connectivity and the offline queue indicator; queued entries flush automatically when the device reconnects.',
          'Balance mismatches: compare the change records against the balance ledger for that customer and reconcile entries in order.'
        ]
      },
      {
        heading: '8. Updates and Incident Response',
        bullets: [
          'Test each release against the core flows: register, sign in, record change, collect change, share WhatsApp message.',
          'For a security incident: contain (rotate credentials, restrict access), assess what data was affected, notify affected customers where required, and record a post-incident summary.',
          'Where a material change to terms occurs, bump the legal document version and require re-acceptance as designed.'
        ]
      },
      {
        heading: '9. Customer Offboarding',
        bullets: [
          'On request, export the customer\'s shops, change records, collections, and message log to CSV.',
          'Confirm fees are settled before final export.',
          'Delete the shop\'s records after the agreed retention period, keeping only what law or dispute defence requires.',
          'Revoke any shared credentials and close the shop portal.'
        ]
      }
    ]
  },
  {
    id: 'purchase-template',
    title: 'Client Software Purchase and Service Agreement (Template)',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'internal',
    intro:
      'TEMPLATE — complete every bracketed field for each business purchasing or licensing ChangeTrack, then sign one copy per client. This template is a starting point and should be reviewed by a qualified Zimbabwean legal professional before first commercial use.',
    sections: [
      {
        heading: 'Parties',
        bullets: [
          'Supplier: Future Pulse Investments, company details: [INSERT: registered company name/number if any, registered address, contact email].',
          'Client (business purchasing ChangeTrack): [INSERT: client legal name, registration number if any, physical address, contact person, email, phone].'
        ]
      },
      {
        heading: '1. Scope',
        paragraphs: [
          'Supplier grants the Client the right to use ChangeTrack for the Client\'s internal retail change recordkeeping, as delivered, for the business named above.',
          'Included in this agreement: [INSERT: modules/features included, number of tills/users, branches covered].'
        ]
      },
      {
        heading: '2. Licence Type and Ownership',
        bullets: [
          'Licence type: [INSERT: e.g. perpetual licence / annual subscription / site licence].',
          'Ownership of the software, source code, and intellectual property remains with Future Pulse Investments. The Client receives only the usage rights in this agreement.',
          'Any deviation (for example source-code escrow) must be written here and signed.'
        ]
      },
      {
        heading: '3. Price and Payment Schedule',
        bullets: [
          'Software licence / purchase fee: [INSERT: amount and currency].',
          'Recurring hosting cost (if applicable): [INSERT: amount, billing frequency].',
          'Maintenance fee (if applicable): [INSERT: amount, billing frequency, what it covers].',
          'Payment terms: [INSERT: e.g. 50% on signing, 50% on acceptance testing; due dates; accepted payment methods].',
          'Late payment: [INSERT: consequence, e.g. access suspension after written notice].'
        ]
      },
      {
        heading: '4. Hosting Responsibilities',
        bullets: [
          'Hosting is provided by: [INSERT: supplier or client].',
          'If client-hosted: the Client is responsible for the hosting account, uptime, and provider relationship; Supplier provides technical configuration support under the maintenance plan.',
          'If supplier-hosted: hosting is billed as in section 3 and covered by the service limitations in the Service Limitations and Data Disclaimer.'
        ]
      },
      {
        heading: '5. Maintenance Plan',
        bullets: [
          'Included: bug fixes for core features, security updates, support via [INSERT: channel] during [INSERT: hours].',
          'Excluded: new features, custom reports, integrations, data entry, training beyond [INSERT: e.g. one onboarding session], and third-party outages.',
          'Enhancements are quoted separately and only start after written approval.'
        ]
      },
      {
        heading: '6. Acceptance Testing',
        bullets: [
          'The Client has [INSERT: number, e.g. 7] days from delivery to verify that registration, recording change, collecting change, QR scanning, and WhatsApp message preparation work as agreed.',
          'Defects found during this window are fixed at no charge. After acceptance, standard maintenance terms apply.'
        ]
      },
      {
        heading: '7. Commencement and Term',
        bullets: [
          'Commencement date: [INSERT: date].',
          'Term: [INSERT: e.g. 12 months from commencement / perpetual for the licence with annual maintenance renewals].'
        ]
      },
      {
        heading: '8. Termination and Data Export',
        bullets: [
          'Either party may terminate per: [INSERT: notice period and grounds].',
          'On termination, Supplier will provide the Client\'s data export in CSV format, subject to fees being settled.',
          'Sections on ownership and intellectual property survive termination.'
        ]
      },
      {
        heading: '9. Governing Law',
        paragraphs: ['This agreement is governed by the laws of Zimbabwe.']
      },
      {
        heading: 'Signatures',
        paragraphs: [
          'For Future Pulse Investments: name, title, signature, date: ______________________',
          'For the Client: name, title, signature, date: ______________________'
        ]
      }
    ]
  },
  {
    id: 'limitations',
    title: 'Service Limitations and Data Disclaimer',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      'This document explains what ChangeTrack is — and what it is not — so you can rely on it appropriately.',
    sections: [
      {
        heading: '1. What ChangeTrack Is',
        paragraphs: [
          'ChangeTrack is a recordkeeping tool for retail outstanding change. It stores shop names, amounts owed, unique Change IDs, dates, collection instructions, collection status, and the pre-filled text for WhatsApp confirmation messages.'
        ]
      },
      {
        heading: '2. What ChangeTrack Is Not',
        bullets: [
          'It is not a bank, mobile money service, or payment processor. No money moves through ChangeTrack.',
          'It is not a financial institution and holds no funds on behalf of anyone.',
          'It is not a legal adviser. Records it produces are business records, not legal advice or legally certified proof.',
          'It is not a guarantor that outstanding change will be collected. A recorded amount is a record of what your business says it owes — collecting it remains a matter between you and your customer.'
        ]
      },
      {
        heading: '3. WhatsApp Messages',
        paragraphs: [
          'ChangeTrack prepares pre-filled WhatsApp messages and opens them in WhatsApp for you to review and send. Unless a separate signed agreement explicitly provides message sending, nothing is transmitted by ChangeTrack itself. Delivery, read status, and the customer\'s response are outside our control.'
        ]
      },
      {
        heading: '4. Your Responsibilities',
        bullets: [
          'Verify amounts and customer details before recording them.',
          'Review records periodically and reconcile balances against your physical cash.',
          'Resolve customer disputes using the audit history as supporting evidence, not as a verdict.',
          'Keep your own exports of important records.'
        ]
      },
      {
        heading: '5. Availability',
        paragraphs: [
          'The platform depends on internet connectivity and third-party cloud services and may be unavailable from time to time. Offline entries are queued locally and sent when the device reconnects, but no uninterrupted availability is promised.'
        ]
      }
    ]
  }
];

export function getDoc(id: string): LegalDoc | undefined {
  return LEGAL_DOCS.find(d => d.id === id);
}

export const CURRENT_TERMS_VERSION = LEGAL_DOCS.find(d => d.id === 'terms')?.version ?? '1.0';
export const CURRENT_PRIVACY_VERSION = LEGAL_DOCS.find(d => d.id === 'privacy')?.version ?? '1.0';
