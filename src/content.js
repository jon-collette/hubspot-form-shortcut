(() => {
  const PROCESSED_ATTR = "data-hs-form-jump-done";
  const SHARE_PROCESSED_ATTR = "data-hs-form-jump-share-done";
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log("[HubSpot Form Shortcut]", ...args);
  }

  function isGuid36(s) {
    // hubspot form ids follow: 636878f4-c071-4364-a036-718a53444013 or 8-4-4-4-12 character sequences.
    // any **more** values align to submission or contact ids
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(s || "")
    );
  }

  function buildPerformanceUrl(portalId, formId) {
    return `https://app.hubspot.com/submissions/${portalId}/form/${formId}/performance`;
  }

  function getPortalAndFormIdFromAction(action) {
    // Example:
    // https://forms.hsforms.com/submissions/v3/public/submit/formsnext/multipart/21003672/<guid>
    const m = (action || "").match(/\/multipart\/(\d{4,})\/([0-9a-f-]{36})/i);
    if (!m) return null;
    return { portalId: m[1], formId: m[2] };
  }

  function createLink(performanceUrl) {
    // generate unique id with time now millisecond id
    const uid = Date.now();
    const wrapperId = "hs-form-link-wrap-20xj6-" + uid;
    const linkId = "hs-form-link-20xj6-" + uid;

    // added wrapper to override form flex
    const wrapper = document.createElement("div");
    wrapper.className = "hs-form-link-wrap-20xj6";
    wrapper.id = wrapperId;

    // generate link
    const link = document.createElement("a");
    link.className = "hs-form-link-20xj6";
    link.href = performanceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.id = linkId;
    link.textContent = "🔗 Go to HubSpot Form →";

    wrapper.appendChild(link);
    return wrapper;
  }

  function extractIdsFromScriptText(text) {
    if (!text || !text.includes("hbspt.forms.create")) return null;

    const portalMatch = text.match(/portalId\s*:\s*["']?(\d+)["']?/i);
    const formMatch = text.match(/formId\s*:\s*["']?([0-9a-f-]{36})["']?/i);

    if (!portalMatch || !formMatch) return null;
    if (!isGuid36(formMatch[1])) return null;

    return {
      portalId: portalMatch[1],
      formId: formMatch[1]
    };
  }

  function extractIdsFromNearbyHubSpotScript(el) {
    const checked = new Set();

    function tryScriptsIn(node) {
      if (!node || checked.has(node)) return null;
      checked.add(node);

      const scripts = [];

      if (node.tagName === "SCRIPT") {
        scripts.push(node);
      }

      if (node.querySelectorAll) {
        scripts.push(...node.querySelectorAll("script"));
      }

      for (const script of scripts) {
        const ids = extractIdsFromScriptText(script.textContent || "");
        if (ids) return ids;
      }

      return null;
    }

    // A) direct wrapper match if we're already inside a hs forms root
    const root = el.closest?.('[data-hs-forms-root="true"]');
    if (root) {
      // same node
      let ids = tryScriptsIn(root);
      if (ids) return ids;

      // previous siblings
      let prev = root.previousElementSibling;
      let hops = 0;
      while (prev && hops < 5) {
        ids = tryScriptsIn(prev);
        if (ids) return ids;
        prev = prev.previousElementSibling;
        hops++;
      }

      // parent container
      ids = tryScriptsIn(root.parentElement);
      if (ids) return ids;
    }

    // B) walk upward looking for a wrapper or nearby scripts
    let node = el;
    let depth = 0;

    while (node && depth < 6) {
      if (node.matches?.('[data-hs-forms-root="true"]')) {
        const ids = tryScriptsIn(node);
        if (ids) return ids;
      }

      // sibling scripts near current node
      let prev = node.previousElementSibling;
      let hops = 0;
      while (prev && hops < 5) {
        const ids = tryScriptsIn(prev);
        if (ids) return ids;
        prev = prev.previousElementSibling;
        hops++;
      }

      node = node.parentElement;
      depth++;
    }

    // C) final broad fallback: any inline HubSpot create call on page
    for (const script of Array.from(document.scripts || [])) {
      const ids = extractIdsFromScriptText(script.textContent || "");
      if (ids) return ids;
    }

    return null;
  }

  function extractIdsFromHubSpotForm(formEl) {
    if (DEBUG) {
      console.log("Attempting an extraction");
    }

    // 1) parse from data attributes
    const portalId = formEl.getAttribute("data-portal-id");
    const formId = formEl.getAttribute("data-form-id");
    if (portalId && isGuid36(formId)) {
      if (DEBUG) {
        console.log("from data attributes");
      }
      return { portalId, formId };
    }

    // 2) parse from action URL
    const action = formEl.getAttribute("action") || "";
    const actionIds = getPortalAndFormIdFromAction(action);
    if (actionIds && actionIds.portalId && isGuid36(actionIds.formId)) {
      if (DEBUG) {
        console.log("from action URL");
      }
      return actionIds;
    }

    // 3) parse from id="hs-form-<guid>-<instance>"
    const idAttr = formEl.getAttribute("id") || "";
    const idMatch = idAttr.match(/hs-form-([0-9a-f-]{36})/i);
    if (idMatch && isGuid36(idMatch[1]) && portalId) {
      if (DEBUG) {
        console.log('from id="hs-form-<guid>-<instance>" ');
      }
      return { portalId, formId: idMatch[1] };
    }

    // 4) parse from class "hs-form-<guid>"
    const className = formEl.className || "";
    const classMatch = className.match(/\bhs-form-([0-9a-f-]{36})\b/i);
    if (classMatch && isGuid36(classMatch[1]) && portalId) {
      if (DEBUG) {
        console.log('from class "hs-form-<guid>"');
      }
      return { portalId, formId: classMatch[1] };
    }

    // 5) fallback: look for HubSpot wrapper / nearby embed script
    const scriptIds = extractIdsFromNearbyHubSpotScript(formEl);
    if (scriptIds) {
      if (DEBUG) {
        console.log("from nearby HubSpot embed script");
      }
      return scriptIds;
    }

    if (DEBUG) {
      console.log("Failed to match a form format match");
    }
  }

  function processEmbeddedForms() {
    if (DEBUG) {
      console.log("Running processEmbeddedForms()");
    }
    const forms = Array.from(
      document.querySelectorAll(
        [
          'form[data-form-id][data-portal-id]',
          'form[id^="hs-form-"]',
          'form[id^="hsForm_"]',
          'form[class*="hs-form-"]',
          'iframe.hs-form-iframe',
          'iframe[class*="hs-form-"]',
          'iframe[class*="hsForm-"]'
        ].join(", ")
      )
    );
    if (DEBUG) {
      console.log("forms length = " + forms.length);
    }
    if (!forms.length) return 0;

    let injectedCount = 0;

    for (const formEl of forms) {
      if (formEl.hasAttribute(PROCESSED_ATTR)) continue;

      const ids = extractIdsFromHubSpotForm(formEl);
      if (!ids) continue;

      const performanceUrl = buildPerformanceUrl(ids.portalId, ids.formId);
      
      const link = createLink(performanceUrl);
      if (DEBUG) {
      	console.log( ids.portalId + " > " + ids.formId );
      	console.log( "formEL: " + formEl );
      }
      // Insert **into** the form
      formEl.insertAdjacentElement("afterend", link);

      // Mark processed
      formEl.setAttribute(PROCESSED_ATTR, "1");
      injectedCount++;
    }

    return injectedCount;
  }

  function processHsFormsSharePages() {
    if (DEBUG) {
      console.log("Running processHsFormsSharePages()");
    }
    // Process form share pages -- don't know why you'd want this but included anyway.
    try {
      const rp = window.hs_RequestParams;
      if (!rp) return false;

      const portalId = rp.portalId;
      const formId = rp.formId;

      if (!portalId || !isGuid36(formId)) return false;

      if (document.documentElement.hasAttribute(SHARE_PROCESSED_ATTR)) return true;

      const performanceUrl = buildPerformanceUrl(portalId, formId);
      const link = createLink(performanceUrl);

      const target = document.querySelector("#form-target");
      if (target) {
        target.insertAdjacentElement("beforeend", link);
      } else if (document.body) {
        document.body.appendChild(link);
      } else {
        document.documentElement.appendChild(link);
      }

      document.documentElement.setAttribute(SHARE_PROCESSED_ATTR, "1");
      if (DEBUG) {
        console.log("processHsFormsSharePages() returned true");
      }
      return true;
    } catch (e) {
      if (DEBUG) {
        console.log("processHsFormsSharePages() returned false");
      }
      return false;
    }
  }

  function run() {
    log("run()", location.href);
    if (DEBUG) {
      console.log("Running run...");
    }
    const shareDidSomething = processHsFormsSharePages();
    const injectedCount = processEmbeddedForms();

    if (shareDidSomething) log("share page link injected (or already present)");
    if (injectedCount) log(`embedded form links injected: ${injectedCount}`);
  }

  function scheduleRuns() {
    // run immediate, 3, 6, 9 seconds
    run();
    setTimeout(run, 3000);
    setTimeout(run, 6000);
    setTimeout(run, 9000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRuns);
  } else {
    scheduleRuns();
  }
})();