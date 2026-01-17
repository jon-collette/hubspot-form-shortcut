
- Injects a single link inside the form  
- Flags forms as processed to avoid duplicate injection  
- Re-checks the page multiple times to catch late-loaded forms (without infinite polling)

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
(LINK TO CHROME WEB STORE)

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

## Copyright

Copyright © 2026  
All rights reserved.