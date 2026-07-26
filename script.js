/* HARDMC — Interações, dados ao vivo & modal de compra */

const CONFIG = {
  ip: 'hardmc.mcsh.io',
  port: 25565,
  name: 'HARDMC',
  discord: 'https://discord.gg/pbEn6KmGM4',
  discordCode: 'pbEn6KmGM4',
};

const SERVER_ADDRESS = `${CONFIG.ip}:${CONFIG.port}`;
const STORE_DATA = { kits: [], tags: [] };

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initMobileMenu();
  initCopyIP();
  initPlayButtons();
  initBuyModal();
  initStoreTabs();
 // initAdminMode();
  initCounters();
  initParticles();
  initCTAParticles();
  initSmoothScroll();
  updateIPDisplay();
  fetchLiveData();
  renderStoreCards();

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

function initStoreTabs() {
  const tabs = document.querySelectorAll('.store-tab');
  const panels = document.querySelectorAll('.store-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (!target) return;
      tabs.forEach((btn) => btn.classList.toggle('active', btn === tab));
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === `${target}-panel`));
    });
  });
}

async function renderStoreCards() {
    const kits = await fetch("data/storeKits.json").then(r => r.json());
    const tags = await fetch("data/storeTags.json").then(r => r.json());

    STORE_DATA.kits = kits;
    STORE_DATA.tags = tags;

    const kitsGrid = document.getElementById("kits-grid");
    const tagsGrid = document.getElementById("tags-grid");

    if (kitsGrid)
        kitsGrid.innerHTML = kits.map((kit, index) => createCardHtml(kit, "Kit", index)).join("");

    if (tagsGrid)
        tagsGrid.innerHTML = tags.map((tag, index) => createCardHtml(tag, "Tag", index)).join("");

    initBuyButtons();
    initGalleryButtons();
}

function createCardHtml(item, type, index) {
  const color = item.color || '#b388ff';
  const gallery = Array.isArray(item.gallery) ? item.gallery : [];
  const galleryCount = gallery.length || 1;
  const logoSrc = item.logo || item.image || gallery[0] || 'assets/img/file.png';
  const cardImageSrc = item.image || item.logo || gallery[0] || 'assets/img/file.png';
  const logoWidth = item.logoWidth || 84;
  const logoHeight = item.logoHeight || 84;
  const cardWidth = Math.max(180, Math.min(320, logoWidth + 40));
  const logoBoxWidth = Math.min(cardWidth - 24, Math.max(logoWidth + 16, 120));
  const logoBoxHeight = Math.max(84, Math.min(logoHeight + 24, 140));
  return `
    <article class="kit-card" style="--card-color: ${color};" data-aos="fade-up">
      <div class="kit-card-top">
        <div class="kit-logo" style="width: ${logoBoxWidth}px; max-width: 100%; height: ${logoBoxHeight}px; margin: 0 auto;"><img src="${logoSrc}" alt="Logo ${item.name}" style="width: ${logoWidth}px; height: ${logoHeight}px; object-fit: contain;" onerror="this.onerror=null;this.src='assets/img/file.png';"></div>
        <div class="kit-badge" style="border-color: ${color}; background: ${color}33;">${type}</div>
      </div>
      <div class="kit-name">${item.name}</div>
      <div class="kit-image">
        <img src="${cardImageSrc}" alt="${item.name}" onerror="this.onerror=null;this.src='assets/img/file.png';">
      </div>
      <p class="kit-description">
    ${(item.description || '').replace(/\n/g, '<br>')}
</p>
      <div class="kit-meta">
        <span class="kit-price">${item.price}</span>
        <span class="kit-gallery-count">${galleryCount} imagem${galleryCount > 1 ? 's' : ''}</span>
      </div>
      <div class="kit-actions">
        <button class="btn btn-outline btn-sm gallery-open" type="button" data-type="${type.toLowerCase()}s" data-index="${index}">Ver Imagens do ${type}</button>
        <button class="btn btn-primary btn-sm" data-buy="${item.name}" data-price="${item.price}">Comprar</button>
      </div>
    </article>
  `;
}

function initBuyButtons() {
  document.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.onclick = null;
    btn.addEventListener('click', () => {
      const kit = btn.dataset.buy || 'Item';
      const price = btn.dataset.price || '';
      const modal = document.getElementById('buy-modal');
      const kitNameEl = modal.querySelector('#modal-kit-name');
      const qrImg = modal.querySelector('#qr-code-img');
      const discordLink = modal.querySelector('#modal-discord-link');
      kitNameEl.textContent = kit;
      modal.querySelector('#modal-kit-price').textContent = price;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(CONFIG.discord)}&bgcolor=0a1520&color=8DFF2F`;
      discordLink.href = CONFIG.discord;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
}

function initGalleryButtons() {
  document.querySelectorAll('.gallery-open').forEach((btn) => {
    btn.onclick = null;
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const index = Number(btn.dataset.index);
      openGallery(type, index);
    });
  });
}

let galleryState = { type: 'kits', index: 0 };
// FEITO POR ISAAC 
function openGallery(type, index) {
  const items = STORE_DATA[type] || [];
  const item = items[index];
  if (!item) return;
  const gallery = Array.isArray(item.gallery) && item.gallery.length ? item.gallery : [item.image || item.logo || 'assets/img/file.png'];
  galleryState = { type, index, galleryIndex: 0, gallery };
  const modal = document.getElementById('gallery-modal');
  const img = document.getElementById('gallery-image');
  const total = document.getElementById('gallery-total');
  const current = document.getElementById('gallery-index');
  const prev = modal.querySelector('.gallery-prev');
  const next = modal.querySelector('.gallery-next');
  const closeBtn = modal.querySelector('.gallery-close');
  const overlay = modal.querySelector('.modal-overlay');
  img.src = gallery[0];
  total.textContent = gallery.length;
  current.textContent = 1;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  prev.onclick = () => changeGallery(-1);
  next.onclick = () => changeGallery(1);
  closeBtn.onclick = closeGallery;
  overlay.onclick = closeGallery;
}

function changeGallery(step) {
  const modal = document.getElementById('gallery-modal');
  const img = document.getElementById('gallery-image');
  const total = document.getElementById('gallery-total');
  const current = document.getElementById('gallery-index');
  const gallery = galleryState.gallery || [];
  if (!gallery.length) return;
  galleryState.galleryIndex = (galleryState.galleryIndex + step + gallery.length) % gallery.length;
  img.src = gallery[galleryState.galleryIndex];
  current.textContent = galleryState.galleryIndex + 1;
}

function closeGallery() {
  const modal = document.getElementById('gallery-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// function initAdminMode() {
//   if (
//   //  !document.getElementById("admin-panel") &&
//    // !document.getElementById("admin-kit-form") &&
//    // !document.getElementById("admin-tag-form")
// ){
//     return;
// }

  const toggle = document.getElementById('toggle-admin-mode');
  const adminPanel = document.getElementById('admin-panel');
  const close = document.getElementById('close-admin');
  const adminTabs = document.querySelectorAll('.admin-tab');
  const adminSections = document.querySelectorAll('.admin-section');
  const kitForm = document.getElementById('admin-kit-form');
  const tagForm = document.getElementById('admin-tag-form');
  const kitsTable = document.getElementById('admin-kits-table');
  const tagsTable = document.getElementById('admin-tags-table');
  const cancelKitEdit = document.getElementById('cancel-kit-edit');
  const cancelTagEdit = document.getElementById('cancel-tag-edit');
  const kitPreviewLogo = document.getElementById('kit-preview-logo');
  const kitPreviewName = document.getElementById('kit-preview-name');
  const kitPreviewPrice = document.getElementById('kit-preview-price');
  const tagPreviewLogo = document.getElementById('tag-preview-logo');
  const tagPreviewName = document.getElementById('tag-preview-name');
  const tagPreviewPrice = document.getElementById('tag-preview-price');
  const output = document.getElementById('admin-output');
  const galleryModal = document.getElementById('gallery-modal');
  const galleryClose = galleryModal?.querySelector('.gallery-close');
  const galleryOverlay = galleryModal?.querySelector('.modal-overlay');

  const loadData = () => {
    const kits = JSON.parse(localStorage.getItem('storeKits') || '[]');
    const tags = JSON.parse(localStorage.getItem('storeTags') || '[]');
    STORE_DATA.kits = kits;
    STORE_DATA.tags = tags;
    renderStoreCards();

    if (kitsTable) {
      kitsTable.innerHTML = kits.map((item, index) => adminRowHtml(item, index, 'kit')).join('');
    }
    if (tagsTable) {
      tagsTable.innerHTML = tags.map((item, index) => adminRowHtml(item, index, 'tag')).join('');
    }
    setTimeout(() => {
      attachRemoveButtons();
      attachEditButtons();
    }, 100);
  };

  const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    loadData();
    if (output) {
      output.value = `DATA-SAVED-${key.toUpperCase()}-${Date.now()}`;
      alert(`Código de saída: ${output.value}`);
    }
  };

  const adminRowHtml = (item, index, type) => {
    const logoSrc = item.logo || item.image || 'assets/img/file.png';
    return `
      <tr>
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td><img src="${logoSrc}" alt="${item.name}" class="admin-logo" onerror="this.onerror=null;this.src='assets/img/file.png';"></td>
        <td><span class="color-badge" style="background:${item.color || '#b388ff'}"></span> ${item.color || '#b388ff'}</td>
        <td>${item.description}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-sm btn-outline" data-edit="${type}" data-index="${index}">Editar</button>
            <button class="btn btn-sm btn-outline" data-remove="${type}" data-index="${index}">Remover</button>
          </div>
        </td>
      </tr>
    `;
  };

  const attachRemoveButtons = () => {
    document.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.remove;
        const index = Number(btn.dataset.index);
        const key = type === 'kit' ? 'storeKits' : 'storeTags';
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        items.splice(index, 1);
        saveData(key, items);
      });
    });
  };

  const attachEditButtons = () => {
    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.edit;
        const index = Number(btn.dataset.index);
        const key = type === 'kit' ? 'storeKits' : 'storeTags';
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const item = items[index];
        if (!item) return;

        const form = type === 'kit' ? kitForm : tagForm;
        const cancelBtn = type === 'kit' ? cancelKitEdit : cancelTagEdit;
        if (!form) return;

        form.elements.name.value = item.name || '';
        form.elements.price.value = item.price || '';
        form.elements.logo.value = item.logo || '';
        form.elements.logoWidth.value = item.logoWidth || 84;
        form.elements.logoHeight.value = item.logoHeight || 84;
        form.elements.color.value = item.color || '#b388ff';
        form.elements.image.value = item.image || '';
        form.elements.gallery.value = Array.isArray(item.gallery) ? item.gallery.join(', ') : '';
        form.elements.description.value = item.description || '';
        form.elements.editIndex.value = index;
        updatePreview(form, type);

        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        cancelBtn?.classList.remove('hidden');
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.textContent = type === 'kit' ? 'Salvar Kit' : 'Salvar Tag';
        }
      });
    });
  };

  adminTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.adminTab;
      if (!target) return;
      adminTabs.forEach((btn) => btn.classList.toggle('active', btn === tab));
      adminSections.forEach((section) => section.classList.toggle('active', section.id === target));
    });
  });

  toggle?.addEventListener('click', () => {
    adminPanel.classList.toggle('hidden');
  });
  close?.addEventListener('click', () => adminPanel.classList.add('hidden'));

  const updatePreview = (form, type) => {
    if (!form) return;

    const name = form.elements.name?.value || (type === 'kit' ? 'Nome do Kit' : 'Nome da Tag');
    const price = form.elements.price?.value || 'R$ 0';
    const logo = form.elements.logo?.value || 'assets/img/vip-rubi.png';
    const width = Number(form.elements.logoWidth?.value || 84);
    const height = Number(form.elements.logoHeight?.value || 84);
    form.elements.name;

    if (type === 'kit') {
      if (kitPreviewName) kitPreviewName.textContent = name;
      if (kitPreviewPrice) kitPreviewPrice.textContent = price;
      if (kitPreviewLogo) {
        kitPreviewLogo.src = logo;
        kitPreviewLogo.style.width = `${Math.min(width, 120)}px`;
        kitPreviewLogo.style.height = `${Math.min(height, 120)}px`;
      }
    } else {
      if (tagPreviewName) tagPreviewName.textContent = name;
      if (tagPreviewPrice) tagPreviewPrice.textContent = price;
      if (tagPreviewLogo) {
        tagPreviewLogo.src = logo;
        tagPreviewLogo.style.width = `${Math.min(width, 120)}px`;
        tagPreviewLogo.style.height = `${Math.min(height, 120)}px`;
      }
    }
  };

  const attachPreviewListeners = (form, type) => {
    ['name', 'price', 'logo', 'logoWidth', 'logoHeight'].forEach((fieldName) => {
      const field = form.elements[fieldName];
      if (field) {
        field.addEventListener('input', () => updatePreview(form, type));
        field.addEventListener('change', () => updatePreview(form, type));
      }
    });
  };

  const handleSubmit = (form, key) => {
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const galleryText = formData.get('gallery')?.toString().trim() || '';
      const gallery = galleryText
        ? galleryText.split(',').map((src) => src.trim()).filter(Boolean)
        : [];
     const newItem = {
    name: formData.get('name')?.toString().trim() || 'Sem nome',
    price: formData.get('price')?.toString().trim() || 'R$ 0',
    logo: formData.get('logo')?.toString().trim() || '',
    logoWidth: Number(formData.get('logoWidth') || 84),
    logoHeight: Number(formData.get('logoHeight') || 84),
    image: formData.get('image')?.toString().trim() || 'assets/img/file.png',

    description: formData.get('description')?.toString() || '',

    gallery,
    color: formData.get('color')?.toString().trim() || '#b388ff',
};
      const editIndex = formData.get('editIndex')?.toString().trim();
      const items = JSON.parse(localStorage.getItem(key) || '[]');

     if (editIndex !== '' && !isNaN(Number(editIndex))) { 
        items[Number(editIndex)] = newItem;
      } else {
        items.push(newItem);
      }

      saveData(key, items);
      form.reset();

requestAnimationFrame(() => {
    updatePreview(form, key === 'storeKits' ? 'kit' : 'tag');
});
      form.elements.editIndex.value = '';
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = key === 'storeKits' ? 'Adicionar Kit' : 'Adicionar Tag';
      }
      if (key === 'storeKits') {
        cancelKitEdit?.classList.add('hidden');
      } else {
        cancelTagEdit?.classList.add('hidden');
      }
      setTimeout(() => {
        attachRemoveButtons();
        attachEditButtons();
      }, 50);
    });
  };

if (kitForm) {
    attachPreviewListeners(kitForm, 'kit');
    updatePreview(kitForm, 'kit');
}

if (tagForm) {
    attachPreviewListeners(tagForm, 'tag');
    updatePreview(tagForm, 'tag');
}

if (kitForm)
    handleSubmit(kitForm, 'storeKits');

if (tagForm)
    handleSubmit(tagForm, 'storeTags');

  cancelKitEdit?.addEventListener('click', () => {
    if (!kitForm) return;

kitForm.reset();
    kitForm.elements.editIndex.value = '';
    cancelKitEdit.classList.add('hidden');
    const submitButton = kitForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = 'Adicionar Kit';
  });

  cancelTagEdit?.addEventListener('click', () => {
   if (!tagForm) return;

tagForm.reset();
    tagForm.elements.editIndex.value = '';
    cancelTagEdit.classList.add('hidden');
    const submitButton = tagForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = 'Adicionar Tag';
  });

  loadData();
  setTimeout(() => {
    attachRemoveButtons();
    attachEditButtons();
  }, 100);

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
