// Afspraakflow: drie stappen, eindigt in een kant-en-klaar WhatsApp- en mailbericht. Geen backend.
// Komt er een boekingssysteem, vervang het formulier in partials/afspraak.html door een link en laat dit script weg.
(() => {
  document.querySelectorAll('[data-flow]').forEach((form) => {
    const steps = [...form.querySelectorAll('[data-step]')];
    const next = form.querySelector('[data-flow-next]');
    const back = form.querySelector('[data-flow-back]');
    const restart = form.querySelector('[data-flow-restart]');
    const bar = form.querySelector('[data-flow-bar]');
    const count = form.querySelector('[data-flow-count]');
    const out = form.querySelector('[data-flow-message]');
    const wa = form.querySelector('[data-flow-whatsapp]');
    const mail = form.querySelector('[data-flow-mail]');
    const copy = form.querySelector('[data-flow-copy]');
    const missing = form.querySelector('[data-flow-missing]');
    const LAST = steps.length - 1; // laatste is het resultaat
    let at = 0;

    const fieldError = (input, show) => {
      input.setAttribute('aria-invalid', String(show));
      document.getElementById(input.getAttribute('aria-describedby'))?.toggleAttribute('hidden', !show);
    };

    const valid = () => {
      if (at !== 2) return true;
      const naam = form.elements.naam;
      const tel = form.elements.telefoon;
      const okNaam = naam.value.trim().length > 1;
      const okTel = tel.value.replace(/\D/g, '').length >= 10;
      fieldError(naam, !okNaam);
      fieldError(tel, !okTel);
      if (!okNaam) naam.focus(); else if (!okTel) tel.focus();
      return okNaam && okTel;
    };

    const message = () => {
      const f = form.elements;
      const dagen = [...form.querySelectorAll('input[name="dag"]:checked')].map((d) => d.value);
      const dagdeel = form.querySelector('input[name="dagdeel"]:checked')?.value;
      const lines = [
        'Hallo Cyril,',
        '',
        f.soort.value === 'Eerst een vraag'
          ? 'Ik heb een vraag over osteopathie en wil graag weten of het bij mijn klacht past.'
          : `Ik wil graag een ${f.soort.value.toLowerCase()} maken.`,
      ];
      if (dagen.length) lines.push(`Voorkeur: ${dagen.join(', ')}${dagdeel && dagdeel !== 'maakt niet uit' ? `, ${dagdeel}` : ''}.`);
      else if (dagdeel && dagdeel !== 'maakt niet uit') lines.push(`Voorkeur: ${dagdeel}.`);
      if (f.klacht.value.trim()) lines.push(`Klacht: ${f.klacht.value.trim()}`);
      lines.push('', `Groet, ${f.naam.value.trim()}`, `Telefoon: ${f.telefoon.value.trim()}`);
      return lines.join('\n');
    };

    const show = (i) => {
      at = i;
      steps.forEach((s, n) => { s.hidden = n !== i; });
      const done = i === LAST;
      bar.style.scale = `${done ? 1 : (i + 1) / LAST} 1`;
      count.textContent = done ? 'Klaar' : `Stap ${i + 1} van ${LAST}`;
      back.hidden = i === 0 || done;
      next.hidden = done;
      restart.hidden = !done;
      if (done) {
        const text = message();
        out.textContent = text;
        const nr = form.dataset.whatsapp.replace(/\D/g, '');
        const adres = form.dataset.mail;
        wa.href = nr ? `https://wa.me/${nr}?text=${encodeURIComponent(text)}` : '#';
        wa.classList.toggle('is-disabled', !nr);
        wa.toggleAttribute('aria-disabled', !nr);
        mail.href = adres ? `mailto:${adres}?subject=${encodeURIComponent('Afspraak osteopathie')}&body=${encodeURIComponent(text)}` : '#';
        mail.classList.toggle('is-disabled', !adres);
        mail.toggleAttribute('aria-disabled', !adres);
        missing.hidden = Boolean(nr && adres);
        steps[i].focus();
      } else {
        steps[i].querySelector('input, textarea')?.focus({ preventScroll: true });
      }
    };

    next.addEventListener('click', () => { if (valid()) show(at + 1); });
    back.addEventListener('click', () => show(at - 1));
    restart.addEventListener('click', () => { form.reset(); show(0); });
    form.addEventListener('submit', (e) => { e.preventDefault(); if (at < LAST && valid()) show(at + 1); });
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input') && at < LAST) { e.preventDefault(); next.click(); }
    });
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(out.textContent); copy.textContent = 'Gekopieerd'; }
      catch { getSelection().selectAllChildren(out); copy.textContent = 'Geselecteerd, kopieer met Ctrl/Cmd+C'; }
      setTimeout(() => { copy.textContent = 'Kopieer bericht'; }, 2500);
    });
  });
})();
