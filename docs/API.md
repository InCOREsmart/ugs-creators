# REST API v1

All routes are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <accessToken>`. JSON errors follow Nest's standard error envelope; production should add a global request-id/error filter.

## Implemented in the current scaffold
| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | /health/live | Process liveness | No |
| GET | /health/ready | Basic readiness | No |
| POST | /auth/register | Create initial manager account | No; protect with invite/registration policy before public launch |
| POST | /auth/login | Email/password login | No, rate-limit at edge |
| POST | /auth/refresh | Rotate refresh token | No |
| GET | /auth/me | Current JWT identity | Yes |
| GET | /campaigns | Paginated campaign list | Yes |
| POST | /campaigns | Create campaign | Yes |
| PATCH | /campaigns/:id | Update campaign/status | Yes |
| POST | /media/upload-url | Issue short-lived S3 PUT URL | Yes |
| POST | /media/process | Enqueue FFmpeg processing | Yes |

## Planned API contract
- `/creators`: GET, POST; `/creators/:id`: GET, PATCH; `/creators/:id/metrics`: GET; `/creators/:id/price-list`: PUT.
- `/campaigns/:id/creators`: GET, POST; `/campaigns/:id/brief-versions`: GET, POST; `/campaigns/:id/accept-brief`: POST.
- `/media/:id/comments`: GET, POST; `/media/:id/approve`: POST; `/media/:id/signed-url`: POST.
- `/contracts`: GET, POST; `/contracts/:id/render`: POST; `/contracts/:id/sign`: POST; `/contracts/:id/acts`: POST.
- `/payments/quote`: POST; `/payments/:id/approve`: POST; `/payments/batches`: POST; `/payments/:id/status`: GET.
- `/ord/creatives`: POST; `/ord/markings`: POST; `/ord/reports`: POST.
- `/analytics/campaigns/:id`: GET; `/analytics/import`: POST.
- `/consents`: POST; `/audit`: GET (privileged role only).

Planned routes are contracts, not claims of implemented integrations. Do not enable real payouts or ORД submission until provider agreements, credentials, idempotency, reconciliation, audit and legal review are complete.
