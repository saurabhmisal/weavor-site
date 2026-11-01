export const contactEmail = "plan@weavor.me";
export function enquiryFields(v, forest) {
  return [
    ["Name", v.name],
    ["Email", v.email],
    ["Country of residence", v.country],
    ["Starting city", v.startingCity],
    ["Preferred dates", v.dates || "Flexible / not sure yet"],
    ["Time available in India", v.duration],
    ["Travellers", v.travellers],
    ["Destination", forest || "Help me choose"],
    ["Interests", v.interests],
    ["Message", v.message],
  ].filter(([, value]) => value && String(value).trim());
}
export function enquiryText(v, forest) {
  return [
    "Hello Weavor,",
    "",
    "I would like to plan a tailor-made wildlife journey in India.",
    "",
    ...enquiryFields(v, forest).map(([label, value]) => `${label}: ${value}`),
    "",
    "Thank you,",
    v.name,
  ].join("\n");
}
export function prepareEnquiry(v, forest) {
  return `mailto:${contactEmail}?subject=${encodeURIComponent(`My Weavor India journey: ${forest || "Help me choose"}`)}&body=${encodeURIComponent(enquiryText(v, forest))}`;
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
export async function copyWithFallback(text, container, status) {
  try {
    if (!globalThis.navigator?.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await globalThis.navigator.clipboard.writeText(text);
    status.textContent = "Copied. Nothing has been sent.";
  } catch {
    let field = container.querySelector(".copy-fallback");
    if (!field) {
      field = element("textarea", "", "copy-fallback");
      field.readOnly = true;
      field.setAttribute("aria-label", "Text to copy");
      container.append(field);
    }
    field.value = text;
    field.rows = Math.min(12, text.split("\n").length + 1);
    field.focus();
    field.select();
    status.textContent =
      "Select and copy the text below. Nothing has been sent.";
  }
}
export function mountEnquiry(form) {
  const panel = form.parentElement;
  let preview;
  const submit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form)),
      forest = values.forest || "Help me choose";
    preview?.remove();
    preview = element("div", "", "enquiry-ready");
    preview.tabIndex = -1;
    preview.append(
      element("h3", "Review your enquiry"),
      element(
        "p",
        "Check your details, then open your email app or copy the enquiry.",
      ),
    );
    const details = element("dl");
    for (const [label, value] of enquiryFields(values, forest)) {
      const row = element("div");
      row.append(element("dt", label), element("dd", value));
      details.append(row);
    }
    const actions = element("div", "", "enquiry-actions"),
      email = element("a", "Open enquiry in email", "button");
    email.href = prepareEnquiry(values, forest);
    const edit = element("button", "Edit my details", "text-link edit-enquiry");
    edit.type = "button";
    edit.addEventListener("click", () => {
      preview.remove();
      form.hidden = false;
      form.elements.namedItem("name").focus();
    });
    const status = element("p", "", "copy-status");
    status.setAttribute("role", "status");
    const copy = element("button", "Copy enquiry", "button button-outline");
    copy.type = "button";
    copy.addEventListener("click", () =>
      copyWithFallback(enquiryText(values, forest), preview, status),
    );
    const address = element("button", "Copy email address", "text-link");
    address.type = "button";
    address.addEventListener("click", () =>
      copyWithFallback(contactEmail, preview, status),
    );
    actions.append(email, copy, edit, address);
    preview.append(
      details,
      actions,
      element(
        "p",
        "Nothing has been sent. Send the message from your email account to plan@weavor.me. This is an enquiry, not a booking.",
        "form-note",
      ),
      status,
    );
    form.hidden = true;
    panel.append(preview);
    preview.focus();
  };
  form.addEventListener("submit", submit);
  form.querySelector('[type="submit"]').disabled = false;
  return () => {
    form.removeEventListener("submit", submit);
    preview?.remove();
    form.hidden = false;
  };
}
export function mountMenu(root = document) {
  const menu = root.querySelector(".menu-toggle"),
    nav = root.querySelector("#main-nav");
  if (!menu || !nav) return () => {};
  const setMenu = (open) => {
    nav.classList.toggle("nav-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "Close" : "Menu";
  };
  const toggle = () => setMenu(menu.getAttribute("aria-expanded") !== "true");
  const link = (e) => {
    if (e.target.closest("a")) setMenu(false);
  };
  const escape = (e) => {
    if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menu.focus();
    }
  };
  menu.addEventListener("click", toggle);
  nav.addEventListener("click", link);
  document.addEventListener("keydown", escape);
  return () => {
    menu.removeEventListener("click", toggle);
    nav.removeEventListener("click", link);
    document.removeEventListener("keydown", escape);
  };
}
export function mountVisuals(root = document) {
  const cleanups = [];
  for (const image of root.querySelectorAll('.reserve-photo img')) {
    const failed = () => {
      image.hidden = true;
      const frame = image.parentElement;
      frame.classList.add('image-unavailable');
      frame.querySelector('.image-fallback').hidden = false;
      const card = frame.closest('.reserve-card');
      if (card) card.setAttribute('aria-label', (card.getAttribute('aria-label') || '').replace(/ — image not available$/, '') + ' — image not available');
    };
    image.addEventListener('error', failed);
    if (image.complete && image.naturalWidth === 0) failed();
    cleanups.push(() => image.removeEventListener('error', failed));
  }
  const stories = [...root.querySelectorAll('.conservation-story')];
  if (stories.length && globalThis.matchMedia) {
    const desktop = globalThis.matchMedia('(min-width: 701px)');
    const update = () => stories.forEach(story => {
      story.open = desktop.matches;
      const summary = story.querySelector('summary');
      summary.tabIndex = desktop.matches ? -1 : 0;
      if (desktop.matches) {
        summary.setAttribute('role', 'heading');
        summary.setAttribute('aria-level', '3');
      } else {
        summary.removeAttribute('role');
        summary.removeAttribute('aria-level');
      }
    });
    update();
    desktop.addEventListener('change', update);
    cleanups.push(() => desktop.removeEventListener('change', update));
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
if (
  typeof document !== "undefined" &&
  document.body.classList.contains("static-page")
) {
  mountMenu();
  mountVisuals();
  document.querySelectorAll("[data-weavor-enquiry]").forEach(mountEnquiry);
}
