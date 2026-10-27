# Security and Russian compliance release checklist

This checklist is an engineering control list, not a legal opinion. Confirm current requirements with Russian counsel and each provider before production.

## Personal data (152-ФЗ)
- [ ] Identify the operator, purposes, legal bases, data categories, retention and deletion schedule.
- [ ] Confirm primary collection, recording, systematization, accumulation, storage, updating and retrieval of Russian citizens' personal data use databases located in the Russian Federation.
- [ ] Publish an accurate privacy policy and obtain consent where consent is the selected legal basis; do not bundle unrelated purposes.
- [ ] Keep consent text/version, timestamp, source, IP where justified, and withdrawal history.
- [ ] Complete Roskomnadzor operator notification where required and assess cross-border transfer restrictions. Default architecture must not send personal data abroad.
- [ ] Sign data-processing/confidentiality terms with providers and verify sub-processors and actual data-centre locations.
- [ ] Separate sensitive identity/bank data; encrypt at application level with managed KMS or envelope encryption. AES-256 alone is not a key-management plan.
- [ ] Use least-privilege DB roles, private networking, TLS, access reviews, MFA for administrators, secret rotation and immutable audit export.
- [ ] Set retention/deletion rules for inactive profiles, logs, backups and uploaded documents; test data-subject request workflows.
- [ ] Test backup restore and incident response; document notification/escalation timelines.

## Advertising and ORD
- [ ] Confirm each placement qualifies as advertising and determine advertiser, advertising distributor, agency and other participant roles.
- [ ] Register creatives/advertising information with the selected Russian ORD and obtain ERID before publication when required.
- [ ] Ensure required advertising label and advertiser details are present in the published placement.
- [ ] Store ERID, creative/version hash, contract, publication URL/time and ORD request/response references.
- [ ] Submit post-placement/statistical reporting within applicable deadlines; retry safely and reconcile rejected reports.
- [ ] Check current restrictions for the specific platform, including platform-specific bans and changing Russian advertising rules.
- [ ] Keep evidence of AI-generated/AI-assisted content disclosures where applicable. Do not encode a blanket assertion that every AI use is subject to one identical statutory declaration; legal applicability depends on current rules and context.

## Payments and contracts
- [ ] Verify self-employed status through an authorized provider/API and record check timestamp/result before payment.
- [ ] Define NPD receipt generation and verification; distinguish payment provider receipt from statutory tax receipt.
- [ ] Have accountant/legal counsel validate tax withholding, reporting and payment process for individuals without a special tax status.
- [ ] Use idempotency keys, double-entry/reconciliation, approval limits and immutable payment status transitions.
- [ ] Do not call platform-held money “escrow” unless a legally valid licensed/contractual model exists. Prefer an authorized Russian bank/payment provider's supported split/nominal-account product.
- [ ] Validate rights term, territory, exclusivity, paid amplification/whitelisting, music/third-party rights and takedown obligations.
- [ ] Use legally valid electronic-signature flows and preserve the evidence package.

## Media and infrastructure
- [ ] Private bucket, public access blocked, short-lived signed URLs, TLS, server-side encryption and least-privilege S3 keys.
- [ ] Quarantine every upload until type/size validation, malware scanning and media probing pass.
- [ ] Add object lifecycle/versioning, separate backup policy, CDN cache controls and signed CDN delivery for private media.
- [ ] Configure DB PITR/backups, restore drills, RPO < 1 hour and RTO < 4 hours with written runbooks.
- [ ] Load-test 15 concurrent uploads/transcodes and verify CPU, disk, queue age and storage egress alarms.
