/* HARDMC — Interações, dados ao vivo & modal de compra */

const CONFIG = {
  ip: 'hardmc.mcsh.io',
  port: 25565,
  name: 'HARDMC',
  discord: 'https://discord.gg/ynYtudrrmP',
  discordCode: 'ynYtudrrmP',
};

const SERVER_ADDRESS = `${CONFIG.ip}:${CONFIG.port}`;

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initMobileMenu();
  initCopyIP();
  initPlayButtons();
  initBuyModal();
  initCounters();
  initParticles();
  initCTAParticles();
  initSmoothScroll();
  updateIPDisplay();
  fetchLiveData();

  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  setInterval(fetchLiveData, 60000);
});

function updateIPDisplay() {
  document.querySelectorAll('.server-address').forEach((el) => {
    el.textContent = SERVER_ADDRESS;
  });
}

async function fetchLiveData() {
  await Promise.all([fetchServerStatus(), fetchDiscordStatus()]);
}

async function fetchServerStatus() {
  const statusEls = document.querySelectorAll('[data-live="server-status"]');
  const playerEls = document.querySelectorAll('[data-live="server-players"]');
  const statPlayerEls = document.querySelectorAll('[data-live-stat="players"]');

  try {
    // Trocamos para a api.mcsrvstat.us que resolve melhor o IP da Aternos
    const res = await fetch(`https://api.mcsrvstat.us/2/${CONFIG.ip}`);
    const data = await res.json();
    
    // Na mcsrvstat, o status online vem direto no campo data.online (true/false)
    const online = data.online === true;
    const players = data.players?.online ?? 0;
    const max = data.players?.max ?? 20;

    statusEls.forEach((el) => {
      el.innerHTML = online
        ? `<span class="status-dot"></span> ONLINE ${players}/${max}`
        : `<span class="status-dot offline"></span> OFFLINE`;
      el.classList.toggle('is-offline', !online);
    });

    playerEls.forEach((el) => { el.textContent = players; });
    statPlayerEls.forEach((el) => {
      el.dataset.count = players;
      el.textContent = players + (el.dataset.suffix || '');
    });
  } catch (error) {
    console.error("Erro ao buscar status do servidor:", error);
    statusEls.forEach((el) => {
      el.innerHTML = `<span class="status-dot offline"></span> OFFLINE`;
      el.classList.add('is-offline');
    });
  }
}

async function fetchDiscordStatus() {
  const memberEls = document.querySelectorAll('[data-live="discord-members"]');
  const onlineEls = document.querySelectorAll('[data-live="discord-online"]');

  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${CONFIG.discordCode}?with_counts=true`);
    const data = await res.json();
    const members = data.approximate_member_count ?? 0;
    const online = data.approximate_presence_count ?? 0;

    memberEls.forEach((el) => {
      el.textContent = members.toLocaleString('pt-BR');
    });

    onlineEls.forEach((el) => {
      el.textContent = online.toLocaleString('pt-BR');
    });

    document.querySelectorAll('[data-live-stat="discord-members"]').forEach((el) => {
      el.dataset.count = members;
      el.textContent = members.toLocaleString('pt-BR');
    });
  } catch {
    /* mantém placeholder */
  }
}

function initLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('hidden'), 400));
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function initCopyIP() {
  document.querySelectorAll('.ip-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(SERVER_ADDRESS);
        btn.classList.add('copied');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-check';
          setTimeout(() => {
            btn.classList.remove('copied');
            icon.className = 'fa-regular fa-copy';
          }, 2000);
        }
        showToast('IP copiado! Cole no Minecraft em Multijogador.');
      } catch {
        showToast('IP: ' + SERVER_ADDRESS);
      }
    });
  });
}

function initPlayButtons() {
  document.querySelectorAll('[data-play]').forEach((btn) => {
    btn.addEventListener('click', playNow);
  });
}

function playNow() {
  const connectUrl = `minecraft://connect/${SERVER_ADDRESS}`;
  const addUrl = `minecraft://?addExternalServer=${encodeURIComponent(CONFIG.name)}|${SERVER_ADDRESS}`;

  navigator.clipboard.writeText(SERVER_ADDRESS).catch(() => {});

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = connectUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    window.location.href = addUrl;
    document.body.removeChild(iframe);
  }, 800);

  showToast('Abrindo o Minecraft... IP copiado caso não abra sozinho!');
}

function initBuyModal() {
  const modal = document.getElementById('buy-modal');
  if (!modal) return;

  const overlay = modal.querySelector('.modal-overlay');
  const closeBtn = modal.querySelector('.modal-close');
  const qrImg = modal.querySelector('#qr-code-img');
  const kitNameEl = modal.querySelector('#modal-kit-name');
  const discordLink = modal.querySelector('#modal-discord-link');

  document.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kit = btn.dataset.buy || 'Kit';
      const price = btn.dataset.price || '';

      kitNameEl.textContent = kit;
      modal.querySelector('#modal-kit-price').textContent = price;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(CONFIG.discord)}&bgcolor=0a1520&color=8DFF2F`;
      discordLink.href = CONFIG.discord;

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]:not([data-live-stat])');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = prefix + value.toFixed(decimals).replace('.', ',') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

function initParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 6}s`;
    container.appendChild(p);
  }
}

function initCTAParticles() {
  const container = document.querySelector('.cta-particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'cta-particle';
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${50 + Math.random() * 50}%`;
    el.style.animationDelay = `${Math.random() * 6}s`;
    container.appendChild(el);
  }
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 4500);
}
