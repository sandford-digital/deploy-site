/* site.js — shared behaviour for every sandford.digital page:
   logo bar width, mobile nav toggle, and (where the page has them) the
   contact form (submitDemoRequest) and the Verify a Session form. */

(function () {
  /* Logo bar: match the width of the "Sandford" word. */
  function syncLogoBars() {
    document.querySelectorAll('.logo__inner').forEach(function (logo) {
      var word = logo.querySelector('.logo__sandford');
      var bar = logo.querySelector('.logo__bar-wrap');
      if (word && bar) bar.style.width = word.offsetWidth + 'px';
    });
  }
  syncLogoBars();
  window.addEventListener('resize', syncLogoBars);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncLogoBars);

  /* Mobile nav. */
  var toggle = document.getElementById('nav-toggle');
  var panel = document.getElementById('nav-panel');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* Contact form — same endpoint and payload as the previous homepage
     "Request a Demo" modal (name, email, organisation, message). */
  var DEMO_ENDPOINT = 'https://europe-west2-sandford-handover.cloudfunctions.net/submitDemoRequest';
  var form = document.getElementById('contact-form');
  if (form) {
    var submit = document.getElementById('contact-submit');
    var status = document.getElementById('contact-status');
    var label = submit.textContent;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form__status';
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      var payload = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        organisation: document.getElementById('contact-organisation').value.trim() || undefined,
        message: document.getElementById('contact-message').value.trim() || undefined,
      };
      try {
        var res = await fetch(DEMO_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
          status.textContent = data.error || 'Something went wrong — please try again or email hello@sandford.digital.';
          status.classList.add('form__status--error');
        } else {
          status.textContent = "Thanks — we've got your message and will be in touch shortly.";
          status.classList.add('form__status--success');
          form.reset();
        }
      } catch (err) {
        status.textContent = 'Could not reach the server — please try again or email hello@sandford.digital.';
        status.classList.add('form__status--error');
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  }

  /* Verify a Session — hands off to the existing public verifier at
     verify.hellohandover.com/{reference}.
     TODO(verification-reference): the copy asks for the report's
     "Session ID", but a Site Scan Session ID (SSS-YYYYMMDD-HHMM-XXXX) is
     NOT what the verifier accepts — it only resolves the 64-character hex
     verification reference that the report's QR code carries
     (sandford-handover/verifier/src/utils/token.ts). A Session ID typed
     here will reach the verifier and be rejected as invalid. This needs a
     real fix (a Session ID -> reference lookup, or reports/verifier using
     one shared identifier), not just a copy change. */
  var VERIFIER_BASE_URL = 'https://verify.hellohandover.com/';
  var verifyForm = document.getElementById('verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('verify-input');
      var value = input.value.trim();
      if (!value) { input.focus(); return; }
      // Accept a pasted verifier link as well as a bare reference.
      var match = value.match(/verify\.hellohandover\.com\/([^/?#\s]+)/i);
      var reference = match ? match[1] : value;
      window.location.href = VERIFIER_BASE_URL + encodeURIComponent(reference);
    });
  }
})();
