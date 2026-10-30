export function prepareEnquiry(values, forest) {
  const fields = [
    ['Name', values.name], ['Email', values.email], ['Country', values.country],
    ['Preferred dates', values.dates || 'Not sure yet'], ['Travellers', values.travellers],
    ['Forest', forest], ['Interests', values.interests || 'Help me explore the options'],
  ];
  const body = ['Hello Weavor,', '', `I would like to plan a ${forest} wildlife journey.`, '',
    ...fields.map(([label, value]) => `${label}: ${value}`), '', values.message || '', '',
    'Thank you,', values.name].join('\n');
  return `mailto:plan@weavor.me?subject=${encodeURIComponent(`My Weavor wildlife journey: ${forest}`)}&body=${encodeURIComponent(body)}`;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function mountEnquiry(form) {
  const forest = form.querySelector('[aria-label="Chosen forest"]').value;
  const panel = form.parentElement;
  let preview;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    preview?.remove();
    preview = element('div', '', 'enquiry-ready');
    preview.tabIndex = -1;
    preview.append(element('p', 'Your next step', 'eyebrow'));
    preview.append(element('h3', `Your enquiry is ready, ${values.name.trim().split(/\s+/)[0]}.`));
    preview.append(element('p', 'Review your details below, then open the email to send your enquiry to our team.'));
    const details = element('dl');
    for (const [label, value] of [
      ['Travelling from', values.country], ['Preferred dates', values.dates || 'Not sure yet'],
      ['Travellers', values.travellers], ['Forest', forest],
      ['Your interests', values.interests || 'Help me explore the options'], ['Your message', values.message],
    ]) {
      if (!value) continue;
      const row = element('div');
      row.append(element('dt', label), element('dd', value));
      details.append(row);
    }
    const email = element('a', 'Open Enquiry in Email', 'button');
    email.href = prepareEnquiry(values, forest);
    const edit = element('button', 'Edit My Details', 'text-link edit-enquiry');
    edit.type = 'button';
    edit.addEventListener('click', () => {
      preview.remove();
      form.hidden = false;
      form.querySelector('[name="name"]').focus();
    });
    preview.append(details, email, edit, element('p', 'Nothing has been sent yet. Your email app will open for you to review and send the message.', 'form-note'));
    form.hidden = true;
    panel.append(preview);
    preview.focus();
  });
  form.querySelector('[type="submit"]').disabled = false;
}

if (typeof document !== 'undefined') {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (menu && nav) {
    const setMenu = (open) => {
      nav.classList.toggle('nav-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Close' : 'Menu';
    };
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menu.focus();
      }
    });
  }
  const form = document.querySelector('[data-weavor-enquiry]');
  if (form) mountEnquiry(form);
}
