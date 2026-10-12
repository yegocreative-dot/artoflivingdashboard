const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const header = document.querySelector('[data-header]');
const menuLabel = document.querySelector('[data-menu-label]');

function closeMenu() {
  menuToggle?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('is-open');
  if (menuLabel) menuLabel.textContent = 'Open menu';
}

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
  if (menuLabel) menuLabel.textContent = open ? 'Open menu' : 'Close menu';
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  closeMenu();
}));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('is-open')) closeMenu();
});

window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true });

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const impactCounters = document.querySelectorAll('[data-count]');
const counterFormatter = new Intl.NumberFormat('en-US');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultEventPromotions = [
  {
    label: 'Upcoming',
    title: 'Programmes and events across Africa',
    href: 'programmes-events.html'
  }
];
const suppliedEventPromotions = Array.isArray(window.IAHV_EVENT_PROMOTIONS)
  ? window.IAHV_EVENT_PROMOTIONS.filter((item) => item?.title && item?.href)
  : [];
const eventPromotions = suppliedEventPromotions.length ? suppliedEventPromotions : defaultEventPromotions;
const eventPromotion = document.querySelector('[data-event-promotion]');
let eventPromotionIndex = 0;

function renderEventPromotion(item) {
  if (!eventPromotion || !item) return;
  const label = eventPromotion.querySelector('[data-event-label]');
  const title = eventPromotion.querySelector('[data-event-title]');
  eventPromotion.href = item.href;
  if (label) label.textContent = item.label || 'Upcoming';
  if (title) title.textContent = item.title;
  if (/^https?:\/\//i.test(item.href)) {
    eventPromotion.target = '_blank';
    eventPromotion.rel = 'noopener noreferrer';
  } else {
    eventPromotion.removeAttribute('target');
    eventPromotion.removeAttribute('rel');
  }
}

renderEventPromotion(eventPromotions[0]);
if (eventPromotion && eventPromotions.length > 1 && !reduceMotion) {
  window.setInterval(() => {
    eventPromotion.classList.add('is-changing');
    window.setTimeout(() => {
      eventPromotionIndex = (eventPromotionIndex + 1) % eventPromotions.length;
      renderEventPromotion(eventPromotions[eventPromotionIndex]);
      eventPromotion.classList.remove('is-changing');
    }, 180);
  }, 7000);
}

function animateCounter(element) {
  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || '';
  if (!Number.isFinite(target)) return;
  if (reduceMotion) {
    element.textContent = `${counterFormatter.format(target)}${suffix}`;
    return;
  }
  const duration = 1250;
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${counterFormatter.format(Math.round(target * eased))}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window && !reduceMotion) {
  impactCounters.forEach((element) => { element.textContent = `0${element.dataset.suffix || ''}`; });
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.45 });
  impactCounters.forEach((element) => counterObserver.observe(element));
} else {
  impactCounters.forEach(animateCounter);
}

const projects = {
  yltp: {
    kicker: 'Youth & leadership',
    title: 'Youth Leadership Training Program',
    lead: 'Empowering young people to lead with resilience, confidence and a commitment to service.',
    focus: ['Mental wellbeing', 'Breath & meditation', 'Leadership', 'Emotional resilience', 'Life skills', 'Community service', 'Youth-led initiatives'],
    outcome: 'Young people gain practical tools for self-regulation and the confidence to create initiatives in their own communities.',
    page: 'project-youth-leadership.html'
  },
  prison: {
    kicker: 'Rehabilitation',
    title: 'Prison SMART',
    lead: 'A two-stage rehabilitation pathway: Prison SMART followed by an advanced Art of Silence programme for eligible participants.',
    focus: ['Stress management', 'Breath-based practices', 'Meditation', 'Trauma and emotional resilience', 'Human values', 'Rehabilitation', 'Reflection and silence'],
    outcome: 'Participants build practical tools for managing stress and difficult emotions, with a pathway into deeper meditation and reflection.',
    page: 'project-prison-program.html'
  },
  bws: {
    kicker: 'Community wellbeing',
    title: 'Breath Water Sound',
    lead: 'An experiential life-skills programme for wellbeing, confidence, emotional balance and positive relationships.',
    focus: ['Breath', 'Emotional intelligence', 'Confidence', 'Life skills', 'Connection', 'Resilience', 'Human values'],
    outcome: 'Simple practices give children and young people a way to navigate difficult emotions, express themselves and reconnect with others.',
    page: 'project-breath-water-sound.html'
  },
  peace: {
    kicker: 'Peace & social cohesion',
    title: 'Peace Building',
    lead: 'Creating peace within. Building peace around us.',
    focus: ['Inner peace', 'Conflict transformation', 'Dialogue', 'Human values', 'Youth engagement', 'Community connection', 'Social cohesion'],
    outcome: 'Breath, dialogue and youth participation create stronger foundations for trust, understanding and peaceful community action.',
    page: 'project-peace-building.html'
  },
  music: {
    kicker: 'Music & culture',
    title: 'Deepening Roots Through Music',
    lead: 'Celebrating Africa’s rich musical traditions while using music as a tool for expression, belonging and peace.',
    focus: ['Music & wellbeing', 'Cultural connection', 'Youth', 'Community', 'Expression', 'Peace', 'Human values'],
    outcome: 'Music becomes a shared language: strengthening identity, bridging difference and helping people feel part of something larger.',
    page: 'project-music-culture.html'
  }
};

const dialog = document.querySelector('[data-project-dialog]');
const dialogTitle = dialog?.querySelector('[data-dialog-title]');
const dialogKicker = dialog?.querySelector('[data-dialog-kicker]');
const dialogLead = dialog?.querySelector('[data-dialog-lead]');
const dialogFocus = dialog?.querySelector('[data-dialog-focus]');
const dialogOutcome = dialog?.querySelector('[data-dialog-outcome]');
const dialogLink = dialog?.querySelector('[data-dialog-link]');

document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!dialog || !project) return;
    dialogKicker.textContent = project.kicker;
    dialogTitle.textContent = project.title;
    dialogLead.textContent = project.lead;
    dialogFocus.innerHTML = project.focus.map((item) => `<li>${item}</li>`).join('');
    dialogOutcome.textContent = project.outcome;
    dialogLink.href = project.page;
    dialog.showModal();
  });
});

dialog?.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const profiles = {
  kenya: {
    index: '01 / 04',
    kicker: 'Kenya programme snapshot',
    title: 'Practical tools. Grassroots leadership.',
    copy: 'Kenya programmes connect breath-based wellbeing with youth leadership, children’s life skills, culture, rehabilitation and community service.',
    stats: [['500+', 'young people reached through YLTP since 2004'], ['500+', 'Prison SMART participants reported since 2002'], ['10,000+', 'story books distributed to Kenyan schools']],
    link: 'country-kenya.html',
    linkLabel: 'Explore the Kenya profile'
  },
  south_africa: {
    index: '02 / 04',
    kicker: 'South Africa · Prison SMART',
    title: 'Rehabilitation with a deeper pathway.',
    copy: 'South Africa’s Prison SMART work combines foundational stress-management and rehabilitation training with an advanced Art of Silence pathway for eligible participants.',
    stats: [['12,300+', 'defensible rounded participant figure since 2002'], ['11', 'South African prisons reached'], ['4 days', 'Art of Silence at Krugersdorp in October 2025']],
    link: 'country-south-africa.html',
    linkLabel: 'Explore the South Africa profile'
  },
  africa: {
    index: '03 / 04',
    kicker: 'Pan-African youth dialogue',
    title: 'One conversation. Twenty-two nations.',
    copy: 'Hundreds of young people joined “Peace Within, Power Beyond” to explore inner strength, resilience and practical tools for mental wellbeing.',
    stats: [['22', 'African nations represented online'], ['100s', 'of young people in dialogue'], ['1', 'shared call for clarity and courageous leadership']],
    link: 'impact.html',
    linkLabel: 'Explore the impact overview'
  },
  next: {
    index: '04 / 04',
    kicker: 'Country profile roadmap',
    title: 'Proof before promotion.',
    copy: 'Every country profile should be published with locally confirmed projects, partners, photographs, stories and impact data. Empty theatre helps nobody.',
    stats: [['Local', 'teams confirm every figure'], ['Real', 'participants lead every story'], ['Open', 'routes make involvement practical']],
    link: 'impact.html#country-profiles',
    linkLabel: 'Explore country profiles'
  }
};

const profileIndex = document.querySelector('[data-profile-index]');
const profileKicker = document.querySelector('[data-profile-kicker]');
const profileTitle = document.querySelector('[data-profile-title]');
const profileCopy = document.querySelector('[data-profile-copy]');
const profileStats = document.querySelector('[data-profile-stats]');
const profileLink = document.querySelector('[data-profile-link]');

function renderProfile(key) {
  const profile = profiles[key];
  if (!profile) return;
  profileIndex.textContent = profile.index;
  profileKicker.textContent = profile.kicker;
  profileTitle.textContent = profile.title;
  profileCopy.textContent = profile.copy;
  profileStats.innerHTML = profile.stats.map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('');
  if (profileLink) {
    profileLink.href = profile.link;
    const arrow = profileLink.querySelector('[aria-hidden="true"]')?.outerHTML || '<span aria-hidden="true">→</span>';
    profileLink.innerHTML = `${profile.linkLabel} ${arrow}`;
  }
}

document.querySelectorAll('[data-country][role="button"]').forEach((marker) => {
  const activate = () => renderProfile(marker.dataset.country);
  marker.addEventListener('click', activate);
  marker.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
});

const stories = [
  {
    image: 'assets/real-stories-yltp.jpg',
    alt: 'Participants practising meditation during a Youth Leadership Training Program',
    quote: 'I learnt how to manage stress and anxiety, approach issues as they come and focus on what I have control over — the present.',
    attribution: 'Faith Waringa — Jomo Kenyatta University, Kenya'
  },
  {
    image: 'assets/story-handwritten.webp',
    alt: 'A handwritten participant reflection after a wellbeing session',
    quote: 'This session has helped me relieve my stress. I felt not alone — today was my friend.',
    attribution: 'Participant reflection, JKUAT'
  },
  {
    image: 'assets/workshop.webp',
    alt: 'A community group celebrating after a Breath Water Sound workshop',
    quote: 'Cool breathing. Feeling healthy. Losing depression.',
    attribution: 'Participant notes, Breath Water Sound workshop'
  }
];

let currentStory = 0;
const storyImage = document.querySelector('[data-story-image]');
const storyQuote = document.querySelector('[data-story-quote]');
const storyAttribution = document.querySelector('[data-story-attribution]');
const storyCounter = document.querySelector('[data-story-counter]');

function renderStory(index) {
  currentStory = (index + stories.length) % stories.length;
  const story = stories[currentStory];
  storyImage.src = story.image;
  storyImage.alt = story.alt;
  storyQuote.textContent = story.quote;
  storyAttribution.textContent = story.attribution;
  storyCounter.textContent = `${String(currentStory + 1).padStart(2, '0')} / ${String(stories.length).padStart(2, '0')}`;
}

document.querySelector('[data-story-prev]')?.addEventListener('click', () => renderStory(currentStory - 1));
document.querySelector('[data-story-next]')?.addEventListener('click', () => renderStory(currentStory + 1));

const orb = document.querySelector('[data-orb]');
const breathLabel = document.querySelector('[data-breath-label]');
const breathCount = document.querySelector('[data-breath-count]');
const breathStart = document.querySelector('[data-breath-start]');
let breathTimer;

const phases = [
  { label: 'Breathe in', className: 'is-inhale', duration: 4 },
  { label: 'Hold softly', className: 'is-hold', duration: 2 },
  { label: 'Breathe out', className: 'is-exhale', duration: 6 }
];

function runBreathingGuide() {
  if (!orb || !breathLabel || !breathCount || !breathStart) return;
  clearInterval(breathTimer);
  let total = 60;
  let phaseIndex = 0;
  let phaseRemaining = phases[0].duration;
  breathStart.disabled = true;
  breathStart.textContent = 'Follow the circle';

  const updatePhase = () => {
    const phase = phases[phaseIndex];
    orb.classList.remove('is-inhale', 'is-hold', 'is-exhale');
    void orb.offsetWidth;
    orb.classList.add(phase.className);
    breathLabel.textContent = phase.label;
  };

  updatePhase();
  breathCount.textContent = total;
  breathTimer = setInterval(() => {
    total -= 1;
    phaseRemaining -= 1;
    breathCount.textContent = Math.max(total, 0);

    if (total <= 0) {
      clearInterval(breathTimer);
      orb.classList.remove('is-inhale', 'is-hold', 'is-exhale');
      breathLabel.textContent = 'Notice';
      breathCount.textContent = '✓';
      breathStart.disabled = false;
      breathStart.textContent = 'Breathe again';
      return;
    }

    if (phaseRemaining <= 0) {
      phaseIndex = (phaseIndex + 1) % phases.length;
      phaseRemaining = phases[phaseIndex].duration;
      updatePhase();
    }
  }, 1000);
}

breathStart?.addEventListener('click', runBreathingGuide);

document.querySelectorAll('[data-video-launch]').forEach((button) => {
  button.addEventListener('click', () => {
    const videoId = button.dataset.videoId;
    if (!videoId) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
    iframe.title = 'Tour Vlog: Gurudev Visits Africa';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  });
});

const newsletterForm = document.querySelector('[data-newsletter-form]');
newsletterForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = newsletterForm.querySelector('input[type="email"]');
  const status = newsletterForm.querySelector('[data-newsletter-status]');
  if (!email?.value.trim() || !email.validity.valid) {
    email?.setAttribute('aria-invalid', 'true');
    if (status) status.textContent = 'Enter a valid email address.';
    email?.focus();
    return;
  }
  email.setAttribute('aria-invalid', 'false');
  if (status) status.textContent = 'Opening your email app to confirm the subscription request.';
  window.location.href = `mailto:info@iahvkidsandyouth.co.ke?subject=${encodeURIComponent('Subscribe to Rhythm & Smiles')}&body=${encodeURIComponent(`Please subscribe ${email.value.trim()} to the Rhythm & Smiles newsletter.`)}`;
});

const archiveFilter = document.querySelector('[data-archive-filter]');
const archiveItems = [...document.querySelectorAll('[data-archive-month]')];
const archiveEmpty = document.querySelector('[data-archive-empty]');
archiveFilter?.addEventListener('change', () => {
  let visible = 0;
  archiveItems.forEach((item) => {
    const show = archiveFilter.value === 'all' || item.dataset.archiveMonth === archiveFilter.value;
    item.hidden = !show;
    if (show) visible += 1;
  });
  if (archiveEmpty) archiveEmpty.hidden = visible !== 0;
});

const contactForm = document.querySelector('[data-contact-form]');
const routeSelect = document.querySelector('#contact-route');
const formStatus = document.querySelector('[data-form-status]');

document.querySelectorAll('[data-route]').forEach((button) => {
  button.addEventListener('click', () => {
    if (routeSelect) routeSelect.value = button.dataset.route;
    contactForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => routeSelect?.focus(), 350);
  });
});

function showFieldError(field, message) {
  const wrapper = field.closest('.form-field');
  const error = wrapper?.querySelector(`[data-error-for="${field.id}"]`);
  wrapper?.classList.toggle('is-invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) {
    error.textContent = message;
    if (message) {
      error.id = `${field.id}-error`;
      field.setAttribute('aria-describedby', error.id);
    } else {
      field.removeAttribute('aria-describedby');
    }
  }
}

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = [...contactForm.querySelectorAll('input[required], textarea[required]')];
  let firstInvalid = null;

  fields.forEach((field) => {
    let message = '';
    if (!field.value.trim()) message = 'Please complete this field.';
    else if (field.type === 'email' && !field.validity.valid) message = 'Enter a valid email address.';
    showFieldError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    if (formStatus) formStatus.textContent = 'Please fix the marked fields.';
    firstInvalid.focus();
    return;
  }

  const data = new FormData(contactForm);
  const subject = `Art of Living Africa — ${data.get('route')}`;
  const body = [
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Country or city: ${data.get('country') || 'Not provided'}`,
    `Route: ${data.get('route')}`,
    '',
    data.get('message')
  ].join('\n');
  if (formStatus) formStatus.textContent = 'Opening your email app with the details preserved.';
  window.location.href = `mailto:africa.desk@artofliving.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const reportForm = document.querySelector('[data-report-form]');

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function selectedFiles(input) {
  return input?.files ? [...input.files] : [];
}

function makeSubmissionId(country, date) {
  const countryCode = String(country || 'AFR').normalize('NFD').replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'AFR';
  const dateCode = String(date || new Date().toISOString().slice(0, 10)).replaceAll('-', '');
  const random = window.crypto?.getRandomValues
    ? window.crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(-4).toUpperCase()
    : Math.random().toString(36).slice(-4).toUpperCase();
  return `AOL-AFR-${dateCode}-${countryCode}-${random}`;
}

if (reportForm) {
  const summaryField = reportForm.querySelector('#report-summary');
  const characterCount = reportForm.querySelector('[data-character-count]');
  const photoInput = reportForm.querySelector('#report-photos');
  const videoInput = reportForm.querySelector('#report-video');
  const mediaLink = reportForm.querySelector('#report-media-link');
  const noVideo = reportForm.querySelector('[name="no_video"]');
  const reporterEmail = reportForm.querySelector('#report-email');
  const reporterWhatsapp = reportForm.querySelector('#report-whatsapp');
  const mediaError = reportForm.querySelector('[data-media-error]');
  const contactError = reportForm.querySelector('[data-contact-error]');
  const status = reportForm.querySelector('[data-report-status]');
  const submitButton = reportForm.querySelector('[data-report-submit]');
  const preview = reportForm.querySelector('[data-report-preview]');
  const previewId = reportForm.querySelector('[data-report-id]');
  const previewSummary = reportForm.querySelector('[data-report-summary]');
  const downloadButton = reportForm.querySelector('[data-report-download]');
  const emailLink = reportForm.querySelector('[data-report-email]');
  const endpoint = reportForm.dataset.uploadEndpoint?.trim();
  let preparedRecord = null;

  const updateCharacterCount = () => {
    if (characterCount && summaryField) characterCount.textContent = `${summaryField.value.length} / 900`;
  };
  summaryField?.addEventListener('input', updateCharacterCount);
  updateCharacterCount();

  [photoInput, videoInput].forEach((input) => input?.addEventListener('change', () => {
    const target = reportForm.querySelector(`[data-file-summary-for="${input.id}"]`);
    const files = selectedFiles(input);
    if (!target) return;
    target.textContent = files.length
      ? files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(', ')
      : input === photoInput ? 'No photographs selected.' : 'No video selected.';
  }));

  function validateReport() {
    let firstInvalid = null;
    const fields = [...reportForm.querySelectorAll('.form-field input, .form-field select, .form-field textarea')]
      .filter((field) => field.type !== 'file');

    fields.forEach((field) => {
      let message = '';
      const value = field.value.trim();
      if (field.required && !value) message = 'Please complete this field.';
      else if (value && !field.validity.valid) message = field.type === 'email' ? 'Enter a valid email address.' : 'Check the format of this field.';
      else if (field.minLength > 0 && value.length < field.minLength) message = `Use at least ${field.minLength} characters.`;
      showFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    const requiredChecks = [...reportForm.querySelectorAll('input[type="checkbox"][required]')];
    requiredChecks.forEach((field) => {
      const wrapper = field.closest('.check-field');
      const message = !field.checked;
      wrapper?.classList.toggle('is-invalid', message);
      field.setAttribute('aria-invalid', String(message));
      if (message && !firstInvalid) firstInvalid = field;
    });

    const hasPhotos = selectedFiles(photoInput).length > 0;
    const tooManyPhotos = selectedFiles(photoInput).length > 4;
    const hasMediaLink = Boolean(mediaLink?.value.trim()) && mediaLink.validity.valid;
    const hasVideo = selectedFiles(videoInput).length > 0;
    const mediaMessages = [];
    if (!hasPhotos && !hasMediaLink) mediaMessages.push('Add at least one approved photograph or source link.');
    if (tooManyPhotos) mediaMessages.push('Choose no more than four photographs.');
    if (!hasVideo && !noVideo?.checked) mediaMessages.push('Add a video or confirm that none is available.');
    if (mediaError) mediaError.textContent = mediaMessages.join(' ');
    if (mediaMessages.length && !firstInvalid) firstInvalid = (!hasPhotos && !hasMediaLink) || tooManyPhotos ? photoInput : noVideo;

    const hasContact = Boolean(reporterEmail?.value.trim() || reporterWhatsapp?.value.trim());
    if (contactError) contactError.textContent = hasContact ? '' : 'Add either an email address or WhatsApp number.';
    if (!hasContact && !firstInvalid) firstInvalid = reporterEmail;

    return firstInvalid;
  }

  function buildRecord(formData) {
    const photos = selectedFiles(photoInput);
    const videos = selectedFiles(videoInput);
    const id = makeSubmissionId(formData.get('country'), formData.get('programme_date'));
    return {
      submission_id: id,
      submitted_at: new Date().toISOString(),
      review_status: 'pending',
      country: formData.get('country'),
      programme_date: formData.get('programme_date'),
      reporting_stream: formData.get('reporting_stream'),
      programme: formData.get('programme'),
      project_type: formData.get('project_type'),
      place: formData.get('place'),
      participants: Number(formData.get('participants')),
      workshops: Number(formData.get('workshops')),
      summary: formData.get('summary'),
      outcome: formData.get('outcome') || '',
      quote: formData.get('quote') || '',
      quote_attribution: formData.get('quote_attribution') || '',
      partner_organisations: formData.get('partner_organisations') || '',
      media_link: formData.get('media_link') || '',
      no_video: formData.get('no_video') === 'yes',
      reporter: {
        name: formData.get('reporter_name'),
        role: formData.get('reporter_role') || '',
        email: formData.get('reporter_email') || '',
        whatsapp: formData.get('reporter_whatsapp') || ''
      },
      confirmations: {
        facts_confirmed: formData.has('facts_confirmed'),
        media_approved: formData.has('media_approved')
      },
      files: {
        photos: photos.map(({ name, size, type }) => ({ name, size, type })),
        video: videos.map(({ name, size, type }) => ({ name, size, type }))
      }
    };
  }

  function showPreparedRecord(record) {
    preparedRecord = record;
    if (previewId) previewId.textContent = record.submission_id;
    if (previewSummary) previewSummary.textContent = JSON.stringify(record, null, 2);
    if (emailLink) {
      const body = [
        `Submission: ${record.submission_id}`,
        `Country: ${record.country}`,
        `Programme: ${record.programme}`,
        `Project type: ${record.project_type}`,
        `Date: ${record.programme_date}`,
        `Participants: ${record.participants}`,
        '',
        record.summary,
        '',
        'Please attach the downloaded JSON record and approved media to this email.'
      ].join('\n');
      emailLink.href = `mailto:info@iahvkidsandyouth.co.ke?subject=${encodeURIComponent(`Africa programme report - ${record.submission_id}`)}&body=${encodeURIComponent(body)}`;
    }
    if (preview) preview.hidden = false;
    preview?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  downloadButton?.addEventListener('click', () => {
    if (!preparedRecord) return;
    const blob = new Blob([`${JSON.stringify(preparedRecord, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preparedRecord.submission_id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status) status.className = '';
    const firstInvalid = validateReport();
    if (firstInvalid) {
      if (status) {
        status.textContent = 'Please fix the marked fields before continuing.';
        status.classList.add('is-error');
      }
      firstInvalid.focus();
      return;
    }

    const formData = new FormData(reportForm);
    const record = buildRecord(formData);
    formData.set('record', JSON.stringify(record));

    if (!endpoint) {
      showPreparedRecord(record);
      if (status) {
        status.textContent = 'Structured record prepared. Media remains on this device until you send it separately.';
        status.classList.add('is-success');
      }
      return;
    }

    submitButton.disabled = true;
    if (status) status.textContent = 'Sending report and media…';
    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);
      showPreparedRecord(record);
      if (status) {
        status.textContent = `Report received. Save this reference: ${record.submission_id}.`;
        status.classList.add('is-success');
      }
      reportForm.reset();
      updateCharacterCount();
    } catch (error) {
      if (status) {
        status.textContent = 'The report was not sent. Keep the files on this device and try again or contact the website administrator.';
        status.classList.add('is-error');
      }
      console.error(error);
    } finally {
      submitButton.disabled = false;
    }
  });
}
