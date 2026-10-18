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
    title: 'Terms and Conditions',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `These Terms and Conditions govern access to and use of ChangeTrack, a retail outstanding-change recordkeeping platform owned and operated by ${COMPANY}, ${JURISDICTION}. Please read them carefully before registering or using the service.`,
    sections: [
      {
        heading: '1. Introduction and Acceptance',
        paragraphs: [
          'By registering an account or using ChangeTrack, you agree to these Terms. If you do not agree, do not register or use the service.',
          'You must be legally able to enter into this agreement. If you use ChangeTrack on behalf of a business, you confirm that you have authority to act for that business and to bind it to these Terms.'
        ]
      },
      {
        heading: '2. Description of the Service',
        paragraphs: [
          'ChangeTrack helps you record and track outstanding change: shop details, amounts, dates, unique Change IDs, collection instructions, collection status, and related communications such as pre-filled WhatsApp confirmation messages.',
          'ChangeTrack is a recordkeeping tool. It does not hold funds, move money, or guarantee that money will be repaid or that outstanding change will be collected. See our Service Limitations and Data Disclaimer.'
        ]
      },
      {
        heading: '3. Accounts and Registration',
        bullets: [
          'You must provide accurate and complete information when registering your shop.',
          'You must protect your login credentials and use a strong, unique password.',
          'You must notify support promptly if you suspect unauthorised access to your account.',
          'You are responsible for activity carried out under your account, to the extent permitted by law.'
        ]
      },
      {
        heading: '4. Acceptable Use',
        paragraphs: [
          'You must not use ChangeTrack for fraud, unlawful debt collection, harassment, unauthorised disclosure of personal information, security attacks, impersonation, or any unlawful activity. Full details are in our Acceptable Use Policy, which forms part of these Terms.'
        ]
      },
      {
        heading: '5. Records and User Responsibilities',
        bullets: [
          'You are responsible for the accuracy and lawful collection of the information you enter.',
          'You must verify amounts, shop details, collection instructions, and collection status before relying on them.',
          'ChangeTrack records must not be represented as independent verification that a debt or outstanding amount exists.'
        ]
      },
      {
        heading: '6. Privacy and Personal Information',
        paragraphs: [
          'Personal information entered into or collected by ChangeTrack is processed as described in our Privacy Policy, available in the Legal & Policies section of this application. Please read it before entering personal information about yourself or your customers.'
        ]
      },
      {
        heading: '7. Intellectual Property and Software Licence',
        paragraphs: [
          `Unless a separate written agreement expressly states otherwise, ${COMPANY} retains ownership of ChangeTrack, its source code, software design, underlying platform, branding, and reusable components.`,
          'You receive permission to use the service within the scope of your applicable licence or subscription. You must not copy, resell, redistribute, reverse engineer, or commercially exploit the software beyond what applicable law or a written agreement permits.'
        ]
      },
      {
        heading: '8. Third-Party Services',
        paragraphs: [
          'The availability of ChangeTrack may depend on third-party hosting, cloud database providers, internet connectivity, messaging applications such as WhatsApp, and other integrations actually used by the application. Those services may have their own terms and privacy policies, and their outages or changes are outside our control.'
        ]
      },
      {
        heading: '9. Availability, Security, and Maintenance',
        paragraphs: [
          `${COMPANY} will take reasonable steps to maintain the service and address reported problems, subject to your applicable service agreement.`,
          'We do not promise uninterrupted service, absolute security, guaranteed uptime, or immediate resolution of every issue.'
        ]
      },
      {
        heading: '10. Payments and Refunds',
        paragraphs: [
          'Where applicable, payments, licence fees, subscriptions, cancellations, and refunds are governed by your purchase or service agreement and our Refund and Cancellation Policy. Nothing in these Terms excludes any mandatory consumer rights you have under applicable law.'
        ]
      },
      {
        heading: '11. Suspension and Termination',
        paragraphs: [
          'We may suspend or terminate access where there is serious misuse, a security threat, non-payment (where applicable), or as provided in your relevant agreement.',
          'Where appropriate we will give reasonable notice and an opportunity to remedy the breach, except where urgent security concerns or legal requirements demand immediate action.',
          'You may stop using ChangeTrack at any time; the data export and deletion rights below continue to apply.'
        ]
      },
      {
        heading: '12. Data Export and Deletion',
        paragraphs: [
          'You may request export or deletion of your information by contacting support, subject to applicable legal obligations, retention requirements, technical limitations, and the terms of your customer agreement. We do not promise that every record can be deleted immediately, particularly where audit, dispute-defence, or legal retention needs apply.'
        ]
      },
      {
        heading: '13. Limitation of Liability',
        reviewNote:
          'LEGAL REVIEW: liability caps and exclusions must be checked against the Consumer Protection Act [Chapter 14:14] and Zimbabwean contract law.',
        paragraphs: [
          'To the maximum extent permitted by applicable law, neither party is liable to the other for indirect, incidental, or consequential losses, including lost profits, lost change, or business interruption arising from use of the platform.',
          'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including liability under applicable consumer protection laws.'
        ]
      },
      {
        heading: '14. Disputes and Governing Law',
        paragraphs: [
          'These Terms are intended to be governed by the laws of Zimbabwe, where legally appropriate.',
          'Before pursuing any other available remedy, please contact support so we can try to resolve the dispute informally. Nothing in these Terms removes rights or remedies available to you under applicable law.'
        ]
      },
      {
        heading: '15. Changes to These Terms',
        paragraphs: [
          'We may update these Terms from time to time. Material changes will be communicated appropriately, and you may be asked to review and re-accept the updated Terms before continuing to use the service. The version number and effective date are shown at the top of this document and recorded with each acceptance.'
        ]
      },
      {
        heading: '16. Contact Information',
        bullets: [
          `Operator: ${COMPANY}`,
          '[INSERT: registered legal name and company registration number, if any.]',
          '[INSERT: business address.]',
          '[INSERT: contact email address.]',
          '[INSERT: support contact and support hours.]'
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
      `This Privacy Policy explains what information ChangeTrack collects, why, how it is stored and protected, who may access it, and the rights you have. It is written for a Zimbabwean audience and is intended to align with the Cyber and Data Protection Act [Chapter 12:07] and other applicable law.`,
    sections: [
      {
        heading: '1. Who Operates ChangeTrack',
        paragraphs: [
          `ChangeTrack is owned and operated by ${COMPANY}, ${JURISDICTION}.`,
          `[INSERT: responsible person/role for privacy matters, contact email, and business address — required before publication.]`,
          '[INSERT: confirm whether the operator is registered with the Data Protection Authority (POTRAZ) as a data controller, if registration is required — to be confirmed with legal counsel.]'
        ]
      },
      {
        heading: '2. Information We Collect',
        paragraphs: ['Based on the actual implementation of the platform, we collect:'],
        bullets: [
          'Account information: your shop name and the email address used to register.',
          'Shop details you enter: branch name, owner name, phone number, address, and currency.',
          'Outstanding-change records you enter: customer names and phone numbers, purchase totals, cash tendered, amounts owed, collection instructions, and notes.',
          'Change IDs, dates and times of recording, and collection status (outstanding, partially paid, collected), including who collected.',
          'Pre-filled WhatsApp message text the platform prepares for you.',
          'Legal acceptance records: which versions of the Terms and Privacy Policy you accepted, when, your optional marketing choice, and your browser user-agent string.',
          'Support communications you send us.',
          'Technical information: basic connection and error logs needed to operate and secure the service.'
        ]
      },
      {
        heading: '3. Purposes of Processing',
        bullets: [
          'Providing the change-tracking service: recording, balancing, and marking change as collected.',
          'Generating Change IDs, QR collection codes, and pre-filled WhatsApp messages.',
          'Keeping an audit history to help you and your customers resolve disputes.',
          'Enforcing and evidencing legal acceptance of our Terms and Privacy Policy.',
          'Sending the one-time welcome email after registration, and optional product news if you separately opted in.',
          'Diagnosing faults and securing the platform.'
        ]
      },
      {
        heading: '4. Lawful Grounds for Processing',
        reviewNote:
          'LEGAL REVIEW: confirm the lawful bases under the Cyber and Data Protection Act [Chapter 12:07] for each processing purpose described here.',
        paragraphs: [
          'We process information on more than one basis depending on the purpose: performance of our contract with you (operating the service you registered for), our legitimate interests in securing and improving the platform, your consent where required (for example optional marketing emails), and compliance with legal obligations. Consent is not the only basis we rely on.'
        ]
      },
      {
        heading: '5. How Information Is Stored and Protected',
        paragraphs: [
          'Records are stored in a managed cloud database (Supabase, running on AWS infrastructure) and communicated over encrypted connections (HTTPS/TLS). Each shop\'s records are isolated by database access rules so one customer cannot read another customer\'s records. Some portal data is cached locally on your own device to allow offline use.',
          'These measures are designed to protect your information, but no system is perfectly secure and we cannot guarantee absolute security.'
        ]
      },
      {
        heading: '6. Who May Access Information',
        bullets: [
          'Authorised staff of the operating company, for support and administration.',
          'You and, where you allow it, employees using your shop portal — only your own shop\'s records.',
          'Hosting and database providers, and the email provider used for the welcome email, acting as processors on our behalf.',
          'No other customer or business can access your records through the platform, and we do not sell personal information.',
          'We may disclose information where required by law or a valid order of a court or regulator.'
        ]
      },
      {
        heading: '7. Storage Outside Zimbabwe',
        reviewNote:
          'LEGAL REVIEW: confirm cross-border transfer requirements under the Cyber and Data Protection Act [Chapter 12:07] for our chosen hosting region.',
        paragraphs: [
          'Our cloud providers operate data centres in multiple countries, and your information may therefore be stored or processed outside Zimbabwe. The specific hosting region: [INSERT: confirm the AWS/Supabase region actually used before publication.]'
        ]
      },
      {
        heading: '8. Retention, Closure, Deletion, and Backups',
        paragraphs: [
          'Records are kept while your account is active, plus a reasonable period for dispute resolution. When you close your account you may request deletion of your information; some audit, acceptance, and accounting records may be retained where required by law or for legitimate dispute defence.',
          'Backups: [INSERT: backup schedule and retention to be confirmed with the hosting configuration.] Deleted information may persist in backups until those backups expire.'
        ]
      },
      {
        heading: '9. Your Rights',
        reviewNote:
          'LEGAL REVIEW: confirm the full list of data subject rights under the Cyber and Data Protection Act [Chapter 12:07], including complaint routes to the Data Protection Authority (POTRAZ).',
        bullets: [
          'Request access to the personal information we hold about you.',
          'Request correction of inaccurate information.',
          'Request deletion of your information, subject to legal retention needs.',
          'Withdraw optional marketing consent at any time.',
          'Exercise any other right available under applicable data protection law.'
        ]
      },
      {
        heading: '10. Complaints and Security Incidents',
        paragraphs: [
          `[INSERT: privacy complaints contact — email or role — and how security incidents should be reported.]`,
          'If a security incident affects your information, we will assess the impact and notify affected customers where required by applicable law.'
        ]
      },
      {
        heading: '11. Children\'s Privacy',
        paragraphs: [
          'ChangeTrack is a business tool intended for shop owners and their authorised staff. It is not directed at children, and accounts should not be registered by persons under 18. Customer records entered by shops should relate to the shops\' business customers.'
        ]
      },
      {
        heading: '12. Third-Party Integrations',
        bullets: [
          'Supabase (database, authentication, cloud functions) — infrastructure provider; see supabase.com/privacy.',
          'WhatsApp (via wa.me links) — messages are prepared by ChangeTrack and opened by you in WhatsApp; we do not send messages through the WhatsApp platform unless a separate agreement provides otherwise. See whatsapp.com privacy notice.',
          'Google Fonts — standard web font delivery; see Google\'s privacy notice.',
          '[INSERT: list any additional third-party services you add, such as the email delivery provider used by the welcome-email function.]'
        ]
      },
      {
        heading: '13. Changes to This Policy',
        paragraphs: [
          'We may revise this Privacy Policy from time to time. Material changes will be communicated appropriately, for example through a notice in the application. If a change materially affects how we process your information, we may ask you to review and acknowledge the updated policy.'
        ]
      },
      {
        heading: '14. Last Updated',
        paragraphs: [
          'This policy is version 1.0 and was last updated on 2026-10-18. The version and date shown here change whenever the policy is revised, and the version you accepted is recorded in your acceptance history.'
        ]
      }
    ]
  },
  {
    id: 'refunds',
    title: 'Refund and Cancellation Policy',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `This policy explains how payments for ChangeTrack are handled, how subscriptions and purchases can be cancelled, and when a refund may be available. It applies to software licence fees, hosting costs, and maintenance charges billed by ${COMPANY}.`,
    sections: [
      {
        heading: '1. Software Purchases versus Subscriptions',
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
          'ChangeTrack is delivered as an online service. Access is provisioned after receipt of the applicable fees. Because the product is digital and access is granted immediately, cooling-off rights may be limited once access begins — this does not remove any mandatory consumer rights you have under Zimbabwean law.'
        ],
        reviewNote:
          'LEGAL REVIEW: confirm how digital-delivery rules interact with the Consumer Protection Act [Chapter 14:14] for your sales channels.'
      },
      {
        heading: '3. Cancellation Procedure',
        bullets: [
          'You may cancel recurring hosting or maintenance by giving written notice to support: [INSERT: required notice period.]',
          'Cancellation stops future billing; it does not by itself entitle you to a refund of fees already paid for the current period.',
          'Cancelling maintenance ends support, bug fixes, and security updates for your installation. Cancelling hosting may make your portal unavailable.'
        ]
      },
      {
        heading: '4. Defective or Undelivered Services',
        bullets: [
          'If a paid service was never provisioned through our fault, or a paid enhancement was not delivered as agreed, contact support with proof of payment and we will remedy the failure or process a refund.',
          'Defects reported within the acceptance-testing window in your purchase agreement are fixed at no charge.'
        ]
      },
      {
        heading: '5. Failed Payments',
        bullets: [
          'If a payment fails, we will notify you and retry or hold provisioning until the account is settled.',
          'Continued non-payment may lead to suspension of access as described in the Terms and Conditions.'
        ]
      },
      {
        heading: '6. Processing of Approved Refunds',
        paragraphs: [
          'Refund requests should be sent in writing to support with proof of payment. Approved refunds are returned via the original payment method where possible.',
          'Refund processing time: [INSERT: number of business days after approval.]'
        ]
      },
      {
        heading: '7. What Is Not Covered',
        paragraphs: [
          'Change of mind after access has been provisioned, unused portions of a billing period, and costs arising from third-party services (for example WhatsApp or internet connectivity) are not refundable unless the law requires otherwise. This policy does not limit mandatory consumer rights.'
        ]
      },
      {
        heading: '8. Contact',
        paragraphs: [
          '[INSERT: payments/billing contact — email address and any postal address.]'
        ]
      }
    ]
  },
  {
    id: 'licence',
    title: 'Software Licence Agreement',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'customer',
    intro:
      `This document explains what you receive when you purchase ChangeTrack. Unless a separate signed agreement expressly states otherwise, ${COMPANY} retains ownership of the software — including the source code — and grants you a licence to use it. Source-code ownership does not transfer unless expressly agreed in a separate signed contract.`,
    sections: [
      {
        heading: '1. The Licence Granted',
        bullets: [
          'A non-exclusive, non-transferable licence to use ChangeTrack for the internal recordkeeping of the business named in your agreement.',
          'Use by the authorised users stated in your agreement (for example, named till operators and administrators).',
          'Any licence scope, term, and number of installations or users stated in the signed agreement.',
          'Term and renewal: [INSERT: e.g. perpetual licence with annual maintenance renewals, or annual subscription.]'
        ]
      },
      {
        heading: '2. Ownership Retained by Future Pulse Investments',
        bullets: [
          'All rights, title, and interest in the source code, object code, and underlying platform.',
          'Reusable components, libraries, and development tools used to build the platform.',
          'Trademarks, branding, documentation, and other intellectual property.'
        ]
      },
      {
        heading: '3. Permitted Use and Restrictions',
        bullets: [
          'No sublicensing, resale, redistribution, or time-sharing of the software.',
          'No copying, modification, or derivative works except as the law expressly permits.',
          'No reverse engineering or attempted extraction of source code.',
          'No removal of branding, copyright notices, or licence identifiers.',
          'No access to the source code except where a signed agreement expressly grants it.'
        ]
      },
      {
        heading: '4. Termination Consequences',
        bullets: [
          'On termination or expiry of your licence, your right to use the software ends and access may be withdrawn.',
          'Your data remains yours: an export is provided per the data export provisions in your agreement, subject to fees being settled.',
          'Sections on ownership and intellectual property survive termination.'
        ]
      },
      {
        heading: '5. Override by Signed Agreement',
        paragraphs: [
          `If ${COMPANY} signs a bespoke agreement with a customer that grants different rights (for example source-code escrow or transfer of a customised installation), that signed agreement overrides this document to the extent of the conflict.`
        ]
      }
    ]
  },
  {
    id: 'purchase-template',
    title: 'Client Purchase and Service Agreement (Template)',
    version: '1.0',
    updated: '2026-10-18',
    audience: 'internal',
    intro:
      'TEMPLATE — complete every bracketed field for each business purchasing ChangeTrack, then sign one copy per client. This template is a starting point and should be reviewed by a qualified Zimbabwean legal professional before first commercial use.',
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
        heading: '4. Delivery and Acceptance Testing',
        bullets: [
          'Delivery: access to the hosted portal is provisioned on or about: [INSERT: date].',
          'The Client has [INSERT: number, e.g. 7] days from delivery to verify that registration, recording change, collecting change, QR scanning, and WhatsApp message preparation work as agreed.',
          'Defects found during this window are fixed at no charge. After acceptance, standard maintenance terms apply.'
        ]
      },
      {
        heading: '5. Hosting Responsibilities',
        bullets: [
          'Hosting is provided by: [INSERT: supplier or client].',
          'If client-hosted: the Client is responsible for the hosting account, uptime, and provider relationship; Supplier provides technical configuration support under the maintenance plan.',
          'If supplier-hosted: hosting is billed as in section 3 and covered by the Service Limitations and Data Disclaimer.'
        ]
      },
      {
        heading: '6. Maintenance and Support Arrangements',
        bullets: [
          'Included: bug fixes for core features, security updates, support via [INSERT: channel] during [INSERT: hours].',
          'Excluded: new features, custom reports, integrations, data entry, training beyond [INSERT: e.g. one onboarding session], and third-party outages.',
          'Enhancements are quoted separately and only start after written approval.'
        ]
      },
      {
        heading: '7. Commencement, Term, and Termination',
        bullets: [
          'Commencement date: [INSERT: date].',
          'Term: [INSERT: e.g. 12 months from commencement / perpetual for the licence with annual maintenance renewals].',
          'Either party may terminate per: [INSERT: notice period and grounds].',
          'On termination, Supplier will provide the Client\'s data export in CSV format, subject to fees being settled.',
          'Sections on ownership and intellectual property survive termination.'
        ]
      },
      {
        heading: '8. Governing Law',
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
        heading: '4. Paid Enhancements, Feature Requests, and Major Upgrades',
        paragraphs: [
          'New features, customisations, integrations, and reports are enhancements, not maintenance. They are scoped and quoted separately. Feature requests are logged and prioritised by the operator; submitting a request does not commit us to build it. Major platform upgrades are delivered at our discretion and announced in advance where they affect your workflows.'
        ]
      },
      {
        heading: '5. Third-Party Fees, Hosting, and Backups',
        bullets: [
          'The platform depends on third-party services (cloud hosting, database, WhatsApp, internet providers). Outages of those services are outside our control; we will assist with diagnosis and provider escalation.',
          'Hosting and third-party fees: [INSERT: who provides and pays for hosting and any provider fees.]',
          'Backups: [INSERT: backup schedule and who is responsible for verifying restoration.] Backups are a shared responsibility: customers should also export their own records periodically.'
        ]
      },
      {
        heading: '6. Security Updates and Incident Reporting',
        bullets: [
          'Security updates are applied to the platform as part of maintenance. Customers should report suspected security issues immediately via: [INSERT: security contact.]',
          'Customers are responsible for keeping their own devices and credentials secure.'
        ]
      },
      {
        heading: '7. Data Recovery Limitations',
        paragraphs: [
          'Recovery from backups is performed only from the backups described in section 5. Changes made since the last backup cannot be recovered. We do not guarantee complete recovery of lost data.'
        ]
      },
      {
        heading: '8. Maintenance Charges',
        paragraphs: [
          'Maintenance is billed as [INSERT: monthly/annual fee, amount to be supplied by the owner] per the signed agreement. Work outside the included scope is quoted and approved before it starts.'
        ]
      },
      {
        heading: '9. Service Termination and Handover',
        bullets: [
          'Either party may end the maintenance agreement per the notice period in the signed agreement: [INSERT: notice period, e.g. 30 days.]',
          'On termination, we will provide available data exports in a common format (such as CSV) for the customer\'s own records, subject to fees being settled.',
          'Further handover arrangements (for example assisting a new service provider) are separately agreed.'
        ]
      },
      {
        heading: '10. Reporting a Bug, Requesting a Feature, or Requesting a Data Export',
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
      'This policy sets out what you must not do when using ChangeTrack, and how violations are enforced. It forms part of the Terms and Conditions.',
    sections: [
      {
        heading: '1. Prohibited Conduct',
        bullets: [
          'Unauthorised access to the platform, other accounts, or other customers\' data, including via automated tools or credential guessing.',
          'Fraud, including entering false records, misrepresenting collection status, or using Change IDs deceptively.',
          'Unlawful debt collection, harassment, or intimidation of any person.',
          'Misuse of personal data: entering personal information about customers without a lawful basis, or extracting other customers\' data.',
          'Security attacks: scanning, probing, or testing the security of the service without written permission; injecting malicious code; attempting to bypass access controls.',
          'Impersonation of any person or business, or false representation of affiliation.',
          'Unlawful activity of any kind, including money laundering and sanctions breaches.',
          'Abuse of the service: excessive automated load, attempts to disrupt availability, or reselling access without permission.'
        ]
      },
      {
        heading: '2. Enforcement',
        paragraphs: [
          'We may investigate suspected violations. Depending on severity, we may warn, suspend, or terminate accounts as provided in the Terms and Conditions, and where unlawful activity is suspected we may report it to the appropriate authorities.'
        ]
      },
      {
        heading: '3. Reporting Violations',
        paragraphs: [
          '[INSERT: security/abuse contact, e.g. an email address for reporting suspected abuse or vulnerabilities.]'
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
      'This guide explains how to use ChangeTrack day to day: registering, recording outstanding change, using Change IDs and QR codes, sharing WhatsApp confirmations, and keeping records correct.',
    sections: [
      {
        heading: '1. Registering and Signing In',
        bullets: [
          'Open the app and choose "Register your shop".',
          'Enter your shop name, email address, and a password of at least 6 characters.',
          'Tick the checkbox confirming you have read the Terms and Conditions and acknowledged the Privacy Policy. Both are clickable links that open in a new tab, so you can read them without losing your registration form. Registration will not complete until this box is ticked.',
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
          '[INSERT: support contact and hours, matching the Maintenance and Support Agreement.]'
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
        heading: '6. Monitoring, Errors, and Security',
        bullets: [
          '[INSERT: chosen monitoring approach — provider logs, uptime checks, error alerts.]',
          'Review authentication and database logs periodically for unusual access patterns.',
          'Apply security updates promptly; track provider advisories.',
          'Report suspected vulnerabilities through the contact in the Acceptable Use Policy.'
        ]
      },
      {
        heading: '7. Troubleshooting and Testing Changes',
        bullets: [
          'Blank screen or failed deploy: reproduce the production build locally and read the first error, not the last.',
          'Customer cannot sign in: check whether email confirmation is pending before resetting credentials.',
          'Sync issues on a till: check connectivity and the offline queue indicator; queued entries flush automatically when the device reconnects.',
          'Balance mismatches: compare the change records against the balance ledger for that customer and reconcile entries in order.',
          'Test each release against the core flows: register, sign in, record change, collect change, share WhatsApp message.'
        ]
      },
      {
        heading: '8. Incident Response and Terms Updates',
        bullets: [
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
          'It is not a guarantor of repayment or collection. A recorded amount is a record of what your business says it owes — collecting it remains a matter between you and your customer.'
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
          'Resolve disagreements and disputes with customers using the audit history as supporting evidence, not as a verdict.',
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
