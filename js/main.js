/* =========================================================
   ROBONEX — 인터랙션 스크립트
   1) 헤더/모바일 메뉴  2) 스크롤(진행바·활성메뉴·맨위로)
   3) 등장 애니메이션   4) 숫자 카운터
   5) 제품 탭          6) FAQ 아코디언
   7) 코드 복사        8) 문의 폼 검증
   ========================================================= */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- 1. 헤더 & 모바일 메뉴 ---------- */
  const header    = $('#header');
  const nav       = $('#nav');
  const navToggle = $('#navToggle');

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

  // 메뉴 링크 클릭 시 닫기
  $$('#nav a').forEach(a => a.addEventListener('click', closeNav));

  // ESC 로 닫기 / 바깥 클릭 시 닫기
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') &&
        !nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  /* ---------- 2. 스크롤 관련 ---------- */
  const progress = $('#scrollProgress');
  const toTop    = $('#toTop');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav__link');

  function onScroll() {
    const y = window.scrollY;

    // 헤더 배경
    header.classList.toggle('is-scrolled', y > 20);

    // 진행 바
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';

    // 맨 위로 버튼
    toTop.classList.toggle('is-visible', y > 600);

    // 현재 섹션 메뉴 활성화
    let currentId = '';
    sections.forEach(sec => {
      if (y >= sec.offsetTop - 140) currentId = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
    });
  }

  // rAF 스로틀링
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- 3. 스크롤 등장 애니메이션 ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 4. 숫자 카운터 ---------- */
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

  /* ---------- 5. 제품 탭 ---------- */
  const tabs = $$('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const panelId = tab.getAttribute('aria-controls');

      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });

      $$('.panel').forEach(p => {
        const show = p.id === panelId;
        p.hidden = !show;
        p.classList.toggle('is-active', show);
      });
    });

    // 좌우 화살표 키로 탭 이동
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = tabs.indexOf(tab);
      const next = e.key === 'ArrowRight'
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  /* ---------- 6. FAQ 아코디언 ---------- */
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

  // 창 크기 변경 시 열린 답변 높이 재계산
  window.addEventListener('resize', () => {
    $$('.acc.is-open .acc__a').forEach(a => { a.style.maxHeight = a.scrollHeight + 'px'; });
  });

  /* ---------- 7. 코드 복사 ---------- */
  const copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const code = $('.code code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.textContent = '복사됨 ✓';
      } catch (err) {
        copyBtn.textContent = '복사 실패';
      }
      setTimeout(() => { copyBtn.textContent = '복사'; }, 1800);
    });
  }

  /* ---------- 8. 문의 폼 검증 ---------- */
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

    // 입력 중 실시간 해제
    $$('input, textarea', form).forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.closest('.field') && input.closest('.field').classList.contains('has-error')) {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();

      const targets = [$('#name'), $('#email'), $('#message')];
      let valid = targets.map(validateField).every(Boolean);

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
