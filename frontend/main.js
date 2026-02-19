// Data maps for modal functionality
const modalDataMap = {
  products: {},
  works: {},
  achievements: {}
};

// ================= HAMBURGER MENU =================
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // Close menu when a link is clicked
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
});

// Helper: Fix image URL (don't add / before full Supabase URLs)
function getImageUrl(img) {
  if (!img) return '';
  // If it's already a full URL (Supabase), use as-is
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  // Otherwise it's a local path, add /
  return `/${img}`;
}

// Image Gallery Component
function createImageGallery(images, cardId) {
  if (!images || images.length === 0) {
    return `
      <div class="card-image-container">
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #999; font-size: 14px;">
          <span>No Image</span>
        </div>
      </div>
    `;
  }
  
  if (images.length === 1) {
    const url = getImageUrl(images[0]);
    return `
      <div class="card-image-container">
        <img src="${url}" alt="Product image" onclick="openModal('${url}')">
      </div>
    `;
  }
  
  let thumbnails = '';
  images.forEach((img, idx) => {
    const url = getImageUrl(img);
    thumbnails += `
      <div class="gallery-thumbnail ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${cardId}', ${idx})">
        <img src="${url}" alt="Thumbnail ${idx + 1}">
      </div>
    `;
  });
  
  const firstUrl = getImageUrl(images[0]);
  return `
    <div class="image-gallery" id="gallery-${cardId}">
      <div class="gallery-main">
        <img src="${firstUrl}" alt="Main image" id="main-img-${cardId}" onclick="openModal('${firstUrl}')">
        ${images.length > 1 ? `
          <button class="gallery-nav prev" onclick="prevImage('${cardId}', ${images.length})">‹</button>
          <button class="gallery-nav next" onclick="nextImage('${cardId}', ${images.length})">›</button>
        ` : ''}
      </div>
      ${images.length > 1 ? `
        <div class="gallery-thumbnails">
          ${thumbnails}
        </div>
      ` : ''}
    </div>
  `;
}

// Gallery Navigation Functions
let galleryStates = {};

function switchGalleryImage(cardId, index) {
  const images = galleryStates[cardId];
  if (!images || !images[index]) return;
  
  const url = getImageUrl(images[index]); // FIXED: use getImageUrl
  
  const mainImg = document.getElementById(`main-img-${cardId}`);
  if (mainImg) {
    mainImg.src = url;
    mainImg.onclick = () => openModal(url);
  }
  
  // Update thumbnails
  const thumbnails = document.querySelectorAll(`#gallery-${cardId} .gallery-thumbnail`);
  thumbnails.forEach((thumb, idx) => {
    if (idx === index) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

function nextImage(cardId, totalImages) {
  const currentIndex = getCurrentImageIndex(cardId);
  const nextIndex = (currentIndex + 1) % totalImages;
  switchGalleryImage(cardId, nextIndex);
}

function prevImage(cardId, totalImages) {
  const currentIndex = getCurrentImageIndex(cardId);
  const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
  switchGalleryImage(cardId, prevIndex);
}

function getCurrentImageIndex(cardId) {
  const activeThumb = document.querySelector(`#gallery-${cardId} .gallery-thumbnail.active`);
  if (!activeThumb) return 0;
  const thumbnails = Array.from(document.querySelectorAll(`#gallery-${cardId} .gallery-thumbnail`));
  return thumbnails.indexOf(activeThumb);
}

// Modal for Full Image View
function openModal(imageSrc) {
  let modal = document.getElementById('imageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
      <span class="modal-close" onclick="closeModal()">&times;</span>
      <div class="modal-content-img">
        <img src="${imageSrc}" alt="Full size image">
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector('.modal-content-img img').src = imageSrc;
  }
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on outside click
document.addEventListener('click', function(e) {
  const modal = document.getElementById('imageModal');
  if (modal && e.target === modal) {
    closeModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// PRODUCTS
fetch("/products")
  .then(r => r.json())
  .then(data => {
    let cardCounter = 0;
    document.getElementById("products").innerHTML =
      data.map(p => {
        const images = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
        const cardId = `product-${cardCounter++}`;
        galleryStates[cardId] = images;
        modalDataMap.products[p.id] = p;
        
        return `
          <div class="card product-card" data-id="${p.id}" onclick="openDescriptionModal('product', ${p.id})">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${p.name}</h4>
              ${p.description ? `<p class="card-description">${p.description.substring(0, 100)}${p.description.length > 100 ? '...' : ''}</p>` : ''}
              ${p.price ? `<p class="product-price">${p.price}</p>` : ''}
              <button class="enquire-btn" onclick="event.stopPropagation(); openOrderModal('${p.name.replace(/'/g, "\\'")}')">
                Buy / Enquire
              </button>
            </div>
          </div>
        `;
      }).join("");
  })
  .catch(err => {
    console.error("Error loading products:", err);
    document.getElementById("products").innerHTML = "<p style='text-align: center; padding: 40px; color: #666;'>Error loading products. Please try again later.</p>";
  });

// WORKS
fetch("/works")
  .then(r => r.json())
  .then(data => {
    let cardCounter = 1000;
    document.getElementById("works").innerHTML =
      data.map(w => {
        const images = w.images && w.images.length > 0 ? w.images : (w.image ? [w.image] : []);
        const cardId = `work-${cardCounter++}`;
        galleryStates[cardId] = images;
        modalDataMap.works[w.id] = w;
        
        return `
          <div class="card work-card" data-id="${w.id}" onclick="openDescriptionModal('work', ${w.id})">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${w.title}</h4>
              ${w.description ? `<p class="card-description">${w.description.substring(0, 100)}${w.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
          </div>
        `;
      }).join("");
  })
  .catch(err => {
    console.error("Error loading works:", err);
    document.getElementById("works").innerHTML = "<p style='text-align: center; padding: 40px; color: #666;'>Error loading works. Please try again later.</p>";
  });

// ACHIEVEMENTS
fetch("/achievements")
  .then(r => r.json())
  .then(data => {
    let cardCounter = 2000;
    document.getElementById("achievements").innerHTML =
      data.map(a => {
        const images = a.images && a.images.length > 0 ? a.images : (a.image ? [a.image] : []);
        const cardId = `achievement-${cardCounter++}`;
        galleryStates[cardId] = images;
        modalDataMap.achievements[a.id] = a;
        
        return `
          <div class="card achievement-card" data-id="${a.id}" onclick="openDescriptionModal('achievement', ${a.id})">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${a.title}</h4>
              ${a.description ? `<p class="card-description">${a.description.substring(0, 100)}${a.description.length > 100 ? '...' : ''}</p>` : ''}
            </div>
          </div>
        `;
      }).join("");
  })
  .catch(err => {
    console.error("Error loading achievements:", err);
    document.getElementById("achievements").innerHTML = "<p style='text-align: center; padding: 40px; color: #666;'>Error loading achievements. Please try again later.</p>";
  });

// Load store settings (logo and name)
fetch("/settings")
  .then(res => res.json())
  .then(settings => {
    const storeName = settings.store_name || "Satyam Enterprises";
    const nameParts = storeName.split(" ");
    const mainName = nameParts[0] || "SATYAM";
    const subName = nameParts.slice(1).join(" ") || "Enterprises";
    
    const storeNameEl = document.getElementById("storeName");
    const storeSubNameEl = document.getElementById("storeSubName");
    
    if (storeNameEl) storeNameEl.textContent = mainName.toUpperCase();
    if (storeSubNameEl) storeSubNameEl.textContent = subName;
    
    if (settings.logo && settings.logo.trim() !== '') {
      const logoEl = document.getElementById("storeLogo");
      if (logoEl) {
        const logoUrl = getImageUrl(settings.logo); // FIXED: use getImageUrl
        const testImg = new Image();
        testImg.onload = function() {
          logoEl.src = logoUrl;
          logoEl.style.display = "block";
          logoEl.alt = `${storeName} Logo`;
        };
        testImg.onerror = function() {
          logoEl.style.display = "none";
        };
        testImg.src = logoUrl;
      }
    } else {
      const logoEl = document.getElementById("storeLogo");
      if (logoEl) logoEl.style.display = "none";
    }
  })
  .catch(err => console.error("Error loading settings:", err));

// ================= DESCRIPTION MODAL SYSTEM =================

let currentModalItem = null;

function openDescriptionModal(type, id) {
  // Retrieve item from map (handle both singular and plural type names)
  const mapType = type === 'product' ? 'products' : (type === 'work' ? 'works' : 'achievements');
  const item = modalDataMap[mapType][id];
  
  if (!item) {
    console.error('Item not found:', type, id);
    return;
  }
  
  currentModalItem = { type, item };
  const modal = document.getElementById('descriptionModal');
  if (!modal) {
    console.error('Description modal not found');
    return;
  }
  
  // Set title
  const titleEl = document.getElementById('descriptionTitle');
  titleEl.textContent = item.name || item.title || '';
  
  // Set category (products only)
  const categoryEl = document.getElementById('descriptionCategory');
  if (type === 'product' && item.category) {
    categoryEl.textContent = item.category;
    categoryEl.style.display = 'block';
  } else {
    categoryEl.style.display = 'none';
  }
  
  // Set images
  const images = (item.images && item.images.length > 0) ? item.images : (item.image ? [item.image] : []);
  const imagesEl = document.getElementById('descriptionImages');
  
  if (images.length === 0) {
    imagesEl.innerHTML = '<div style="width: 100%; height: 300px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">No Image</div>';
  } else if (images.length === 1) {
    const url = getImageUrl(images[0]);
    imagesEl.innerHTML = `
      <div class="description-gallery-main">
        <img src="${url}" alt="Product image" onclick="openModal('${url}')">
      </div>
    `;
  } else {
    let thumbnails = '';
    images.forEach((img, idx) => {
      const url = getImageUrl(img);
      thumbnails += `
        <div class="description-gallery-thumbnail ${idx === 0 ? 'active' : ''}" onclick="switchDescriptionImage(${idx})">
          <img src="${url}" alt="Thumbnail ${idx + 1}">
        </div>
      `;
    });
    
    const firstUrl = getImageUrl(images[0]);
    imagesEl.innerHTML = `
      <div class="description-gallery-main">
        <img id="description-main-img" src="${firstUrl}" alt="Main image" onclick="openModal('${firstUrl}')">
      </div>
      <div class="description-gallery-thumbnails" id="description-thumbnails">
        ${thumbnails}
      </div>
    `;
  }
  
  // Set description
  const descEl = document.getElementById('descriptionText');
  descEl.textContent = item.description || 'No description available';
  
  // Set price (products only)
  const priceEl = document.getElementById('descriptionPrice');
  if (type === 'product' && item.price) {
    priceEl.textContent = item.price;
    priceEl.style.display = 'block';
  } else {
    priceEl.style.display = 'none';
  }
  
  // Set action button
  const actionBtn = document.getElementById('descriptionActionBtn');
  if (type === 'product') {
    actionBtn.style.display = 'block';
    actionBtn.textContent = 'Buy / Enquire';
  } else {
    actionBtn.style.display = 'none';
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Store images globally for switching
  window.descriptionImages = images;
}

function switchDescriptionImage(index) {
  const images = window.descriptionImages;
  if (!images || !images[index]) return;
  
  const url = getImageUrl(images[index]);
  const mainImg = document.getElementById('description-main-img');
  if (mainImg) {
    mainImg.src = url;
    mainImg.onclick = () => openModal(url);
  }
  
  // Update thumbnails
  const thumbnails = document.querySelectorAll('.description-gallery-thumbnail');
  thumbnails.forEach((thumb, idx) => {
    if (idx === index) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

function closeDescriptionModal() {
  const modal = document.getElementById('descriptionModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  currentModalItem = null;
  window.descriptionImages = null;
}

function handleModalAction() {
  if (!currentModalItem || currentModalItem.type !== 'product') return;
  // Close product description and open order modal for enquiries
  closeDescriptionModal();
  openOrderModal(currentModalItem.item.name);
}

// Service toggle function
function toggleService(button) {
  const serviceCard = button.closest('.service-card');
  if (!serviceCard) return;
  serviceCard.classList.toggle('active');
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  const modal = document.getElementById('descriptionModal');
  if (modal && e.target && e.target.classList && e.target.classList.contains('description-modal-overlay')) {
    closeDescriptionModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeDescriptionModal();
  }
});

// ================= ORDER ENQUIRY SYSTEM =================

let selectedProductName = "";

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeOrderModal();
    });
  }
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeOrderModal();
  });
  
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitOrder();
    });
    
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
    });
  }
});

function openOrderModal(productName) {
  try {
    selectedProductName = productName;
    const modal = document.getElementById("orderModal");
    if (!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const productTitle = document.getElementById("modalProductName");
    if (productTitle) productTitle.textContent = productName;
    
    setTimeout(() => {
      const nameInput = document.getElementById("orderName");
      if (nameInput) nameInput.focus();
    }, 100);
    
  } catch (error) {
    console.error('Error opening order modal:', error);
  }
}

// Open order modal and immediately open WhatsApp with a quick prefilled message


function closeOrderModal() {
  try {
    const modal = document.getElementById("orderModal");
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    const form = document.getElementById("orderForm");
    if (form) form.reset();
    
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

function validateField(field) {
  const errorElement = field.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) return true;
  
  let isValid = true;
  field.classList.remove('error');
  errorElement.style.display = 'none';
  
  if (field.required && !field.value.trim()) {
    errorElement.textContent = 'This field is required';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
    errorElement.textContent = 'Please enter a valid email address';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  } else if (field.id === 'orderPhone' && field.value && !/^[0-9]{10,15}$/.test(field.value)) {
    errorElement.textContent = 'Please enter a valid phone number (10-15 digits)';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  }
  
  return isValid;
}

function submitOrder() {
  try {
    const form = document.getElementById('orderForm');
    const nameInput = document.getElementById('orderName');
    const phoneInput = document.getElementById('orderPhone');
    const addressInput = document.getElementById('orderAddress');
    const submitBtn = document.getElementById('submitOrderBtn');
    
    if (!form || !nameInput || !phoneInput || !submitBtn) return;
    
    let isValid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!validateField(field)) isValid = false;
    });
    
    if (!isValid) {
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
      return;
    }
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput ? addressInput.value.trim() : '';
    
    const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Opening WhatsApp...';
    
    const adminPhone = "7558450517";
    
    const message = `🔔 *New Product Enquiry* 🔔

*Product:* ${selectedProductName || 'Not specified'}
*Name:* ${name}
*Phone:* ${phone}
${address ? `*Address:* ${address}\n` : ''}
_${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}_`.trim();
    
    const whatsappURL = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
    
    form.reset();
    setTimeout(() => {
      closeOrderModal();
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('.btn-text').textContent = originalBtnText;
    }, 500);
    
  } catch (error) {
    console.error('Error submitting order:', error);
    alert(`Error: ${error.message || 'Failed to submit. Please try again.'}`);
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Send Enquiry';
    }
  }
}

// FAQ Toggle Function
function toggleFAQ(button) {
  const faqItem = button.closest('.faq-item');
  if (!faqItem) return;
  
  faqItem.classList.toggle('active');
  
  // Close other active FAQs if you want only one open at a time (optional)
  // document.querySelectorAll('.faq-item.active').forEach(item => {
  //   if (item !== faqItem) item.classList.remove('active');
  // });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Fade-in animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }, 100);
});