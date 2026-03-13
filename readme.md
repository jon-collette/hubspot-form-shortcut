# HubSpot Form Shortcut

**HubSpot Form Shortcut** is a lightweight Chrome extension that adds a minimal link directly inside embedded HubSpot forms, allowing you to jump straight to the form’s **HubSpot performance page** from any live website.

No inspecting DOM elements.  
No copying portal IDs or form IDs.  
No manually constructing URLs.

---

## What this extension does

When a page loads, HubSpot Form Shortcut runs entirely in your browser and:

1. Detects embedded HubSpot forms on the page  
2. Extracts the **portal ID** and **form ID** from the form markup  
3. Builds the correct HubSpot performance URL at runtime  
4. Injects a small, unobtrusive link inside the form  

Clicking the link opens the form’s **performance page** in HubSpot, where you can:
- Review submissions
- Edit the form
- View associated marketing campaigns
- Inspect workflows tied to the form

---

## Why this exists

HubSpot forms are identified by two values:
- **Portal ID** (your HubSpot account)
- **Form ID** (a unique GUID)

Those values are always present in the page when a form renders—but HubSpot does not expose an easy way to navigate from a live embedded form back to its internal form record.

Without this extension, accessing the form requires:
- Opening DevTools
- Inspecting the form element
- Extracting IDs
- Manually assembling the HubSpot URL

HubSpot Form Shortcut automates that entire workflow.

---

## How it works (technical overview)

- Runs **100% at runtime** in the browser  
- Scans the DOM for known HubSpot form patterns:
  - `data-portal-id` / `data-form-id`
  - HubSpot form IDs and class names
  - Submission endpoints when present
  - HubSpot share pages via `window.hs_RequestParams`
  - HubSpot iFrame embeds (and reads from embed script instead)
- Builds the performance URL using the standard HubSpot format:
  https://app.hubspot.com/submissions/{portalId}/form/{formId}/performance
- Injects a single link after the form (to unify handling on iframe and dynamically added forms)
- Flags forms as processed to avoid duplicate injection  
- Re-checks the page multiple times to catch late-loaded forms at init, 3, 6, 9 seconds (without infinite polling)

The extension is defensive by design and works across modern, dynamically injected HubSpot form embeds.

---

## Privacy & data usage

**HubSpot Form Shortcut does not collect, store, or transmit any data.**

- No analytics
- No tracking
- No API calls
- No external requests

All logic runs locally in your browser and only reads identifiers already present in the page’s HTML.

---

## Permissions

The extension requires broad host access (`<all_urls>`) because HubSpot forms can be embedded on **any domain**. There is no fixed list of sites where HubSpot forms may appear.

The extension explicitly **does not run** on HubSpot application pages (for example, `app.hubspot.com`).

---

## Installation

### From the Chrome Web Store
👉 **Install HubSpot Form Shortcut**  
https://chromewebstore.google.com/detail/hubspot-form-shortcut/fhdigmbmlcienhomcailaclnkkedajaa

### Local development
This repository is provided for transparency and review.  
No license is granted for redistribution or derivative works.

---

## Who this is for

- Marketing operations teams  
- RevOps professionals  
- Developers working with HubSpot embeds  
- Anyone auditing or maintaining HubSpot forms on live sites  

If you regularly find yourself asking *“Which form is this?”*, this extension saves time immediately.

---

## Chrome Extension Packaging reminder

Package is just the files, no parent folder

---

## Copyright

Copyright © 2026  
All rights reserved.