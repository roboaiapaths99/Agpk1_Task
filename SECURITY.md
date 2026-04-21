# Security Manifest — AGPK1-Task Enterprise

This document outlines the security architecture and hardening measures implemented in the AGPK1-Task platform to ensure mission-critical reliability and data integrity.

## 1. Authentication & Session Management
- **Protocol**: JWT (JSON Web Tokens) with a short-lived access token (15m) and a persistent, secure, httpOnly refresh token.
- **MFA Ready**: Infrastructure supports email verification and multi-factor authentication hooks.
- **Password Security**: Bcrypt (12 rounds) used for all credential hashing. No plain-text passwords ever touch the database.

## 2. Authorization (RBAC)
- **Granular Controls**: Role-Based Access Control enforced at the middleware layer.
- **Hierarchy**: Admin (Full Access), Manager (Org-wide access), User (Profile/Assigned access).
- **Scope Verification**: Every sensitive request is validated for both "Ownership" and "Permission".

## 3. Multi-Tenant Isolation
- **Defense-in-Depth**: Isolation is enforced at two layers:
    1. **Application Layer**: Controllers fetch data using `organizationId`.
    2. **Database Layer (Zero-Trust)**: A global Mongoose plugin automatically filters every query by the authenticated user's `organizationId`. It is impossible for a user in Org A to accidentally query data from Org B.

## 4. Audit & Compliance
- **Automated Logging**: Every state-changing operation (POST, PUT, DELETE) is automatically recorded in the `auditlogs` collection.
- **Traceability**: Logs include the User ID, Org ID, Action type, previous/new values (where applicable), IP address, and timestamp.
- **Immutability**: Audit logs are designed to be append-only in production environments.

## 5. Infrastructure Security
- **Rate Limiting**: Global and route-specific limits to prevent Brute-Force and DoS attacks.
- **Security Headers**: Helmet.js deployed with strict CSP, HSTS, and X-Frame-Options.
- **Data Sanitization**:
    - NoSQL Injection protection via `express-mongo-sanitize`.
    - XSS protection via a custom enterprise-grade sanitizer.
- **Background Jobs**: Heavy operations (Email, reporting) are offloaded to BullMQ with retry logic, preventing API thread blocking.

## 6. Real-time Security
- **Hardened WebSockets**: Handshake requires a valid JWT. Users are automatically isolated into tenant-specific rooms (`org:${orgId}`) upon connection.

---
**Security Status**: HARDENED & PRODUCTION READY
**Last Audit**: April 2026
