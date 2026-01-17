(() => {
  const PROCESSED_ATTR = "data-hs-form-jump-done";
  const SHARE_PROCESSED_ATTR = "data-hs-form-jump-share-done";
  const DEBUG = false;

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
  	// added wrapper to override form flex
    const wrapper = document.createElement("div");
    wrapper.className = "hs-form-link-wrap-20xj6";

	// generate link
    const link = document.createElement("a");
    link.className = "hs-form-link-20xj6";
    link.href = performanceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "🔗 Go to HubSpot Form →";

    wrapper.appendChild(link);
    return wrapper;
  }


  function extractIdsFromHubSpotForm(formEl) {
    // 1) parse from data attributes
    const portalId = formEl.getAttribute("data-portal-id");
    const formId = formEl.getAttribute("data-form-id");
    if (portalId && isGuid36(formId)) {
      return { portalId, formId };
    }

    // 2) parse from action URL
    const action = formEl.getAttribute("action") || "";
    const actionIds = getPortalAndFormIdFromAction(action);
    if (actionIds && actionIds.portalId && isGuid36(actionIds.formId)) {
      return actionIds;
    }

    // 3) parse from id="hs-form-<guid>-<instance>"
    const idAttr = formEl.getAttribute("id") || "";
    const idMatch = idAttr.match(/hs-form-([0-9a-f-]{36})/i);
    if (idMatch && isGuid36(idMatch[1]) && portalId) {
      return { portalId, formId: idMatch[1] };
    }

	// 4) parse from class "hs-form-<guid>"
    const className = formEl.className || "";
    const classMatch = className.match(/\bhs-form-([0-9a-f-]{36})\b/i);
    if (classMatch && isGuid36(classMatch[1]) && portalId) {
      return { portalId, formId: classMatch[1] };
    }

    return null;
  }

  function processEmbeddedForms() {
    const forms = Array.from(
      document.querySelectorAll(
        'form[data-form-id][data-portal-id], form[id^="hs-form-"], form[class*="hs-form-"]'
      )
    );

    if (!forms.length) return 0;

    let injectedCount = 0;

    for (const formEl of forms) {
      if (formEl.hasAttribute(PROCESSED_ATTR)) continue;

      const ids = extractIdsFromHubSpotForm(formEl);
      if (!ids) continue;

      const performanceUrl = buildPerformanceUrl(ids.portalId, ids.formId);

      const link = createLink(performanceUrl);

      // Insert **into** the form
      formEl.insertAdjacentElement("beforeend", link);

      // Mark processed
      formEl.setAttribute(PROCESSED_ATTR, "1");
      injectedCount++;
    }

    return injectedCount;
  }

  function processHsFormsSharePages() {
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
      return true;
    } catch (e) {
      return false;
    }
  }

  function run() {
    log("run()", location.href);

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
