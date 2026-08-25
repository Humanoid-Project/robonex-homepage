/* =========================================================
   ROBONEX — 인터랙션 스크립트
   1) 내비게이션(스크롤 상태 · 모바일 메뉴 · 현재 섹션)
   2) 등장 애니메이션  3) 숫자 카운터
   4) FAQ 아코디언     5) 코드 복사   6) 문의 폼 검증
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 1. 내비게이션 ---------- */
  const header    = $('#header');
  const nav       = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks  = $$('.gnav__link');

  function closeNav() {
    nav.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '메뉴 열기');
  }

  navToggle.addEventListener('click', () => {
    const opened = nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', opened);
    navToggle.setAttribute('aria-expanded', String(opened));
    navToggle.setAttribute('aria-label', opened ? '메뉴 닫기' : '메뉴 열기');
  });

  $$('#nav a').forEach(a => a.addEventListener('click', closeNav));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') &&
        !nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  // 메뉴가 가리키는 섹션들 (제품은 래퍼 div 이므로 id 로 직접 조회)
  const targets = navLinks
    .map(link => {
      const id = (link.getAttribute('href') || '').slice(1);
      const el = id ? document.getElementById(id) : null;
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  function onScroll() {
    const y = window.scrollY;

    header.classList.toggle('is-scrolled', y > 10);

    let current = null;
    targets.forEach(t => {
      if (y >= t.el.offsetTop - 120) current = t.link;
    });
    navLinks.forEach(link => link.classList.toggle('is-active', link === current));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ---------- 2. 등장 애니메이션 ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 3. 숫자 카운터 ---------- */
  function runCounter(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
      el.textContent = prefix + Math.round(target * eased).toLocaleString('ko-KR') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const statsBox = $('#stats');
  if (statsBox && 'IntersectionObserver' in window) {
    const statIO = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.stat__num', entry.target).forEach(runCounter);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statIO.observe(statsBox);
  } else if (statsBox) {
    $$('.stat__num', statsBox).forEach(runCounter);
  }

  /* ---------- 4. FAQ 아코디언 ---------- */
  $$('.acc').forEach(item => {
    const btn    = $('.acc__q', item);
    const answer = $('.acc__a', item);

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // 하나만 열리도록 나머지 닫기
      $$('.acc').forEach(other => {
        other.classList.remove('is-open');
        $('.acc__q', other).setAttribute('aria-expanded', 'false');
        $('.acc__a', other).style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  window.addEventListener('resize', () => {
    $$('.acc.is-open .acc__a').forEach(a => { a.style.maxHeight = a.scrollHeight + 'px'; });
  });

  /* ---------- 5. 코드 복사 ---------- */
  const copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const code = $('.code code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.textContent = '복사됨';
      } catch (err) {
        copyBtn.textContent = '복사 실패';
      }
      setTimeout(() => { copyBtn.textContent = '복사'; }, 1800);
    });
  }

  /* ---------- 6. 문의 폼 검증 ---------- */
  const form = $('#contactForm');
  if (form) {
    const done  = $('#formDone');
    const agree = $('#agree');
    const agreeErr = $('.err--agree');

    function setError(input, message) {
      const field = input.closest('.field');
      if (!field) return;
      field.classList.toggle('has-error', Boolean(message));
      const small = $('.err', field);
      if (small) small.textContent = message || '';
    }

    function validateField(input) {
      const value = input.value.trim();
      if (input.required && !value) {
        setError(input, '필수 입력 항목입니다.');
        return false;
      }
      if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(input, '올바른 이메일 형식이 아닙니다.');
        return false;
      }
      setError(input, '');
      return true;
    }

    $$('input, textarea', form).forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('has-error')) validateField(input);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();

      const required = [$('#name'), $('#email'), $('#message')];
      let valid = required.map(validateField).every(Boolean);

      if (!agree.checked) {
        agreeErr.textContent = '개인정보 수집 및 이용에 동의해 주세요.';
        valid = false;
      } else {
        agreeErr.textContent = '';
      }

      if (!valid) {
        const firstBad = $('.field.has-error input, .field.has-error textarea', form);
        if (firstBad) firstBad.focus();
        return;
      }

      // TODO: 실제 서버 전송 지점 (예: fetch('/api/contact', { method: 'POST', body: new FormData(form) }))
      const payload = Object.fromEntries(new FormData(form).entries());
      console.log('[ROBONEX] 문의 접수:', payload);

      form.reset();
      done.hidden = false;
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { done.hidden = true; }, 6000);
    });
  }

  /* ---------- 기타: 푸터 연도 ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
