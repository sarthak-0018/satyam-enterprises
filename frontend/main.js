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
    return `
      <div class="card-image-container">
        <img src="/${images[0]}" alt="Product image" onclick="openModal('/${images[0]}')">
      </div>
    `;
  }
  
  let thumbnails = '';
  images.forEach((img, idx) => {
    thumbnails += `
      <div class="gallery-thumbnail ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage(${cardId}, ${idx})">
        <img src="/${img}" alt="Thumbnail ${idx + 1}">
      </div>
    `;
  });
  
  return `
    <div class="image-gallery" id="gallery-${cardId}">
      <div class="gallery-main">
        <img src="/${images[0]}" alt="Main image" id="main-img-${cardId}" onclick="openModal('/${images[0]}')">
        ${images.length > 1 ? `
          <button class="gallery-nav prev" onclick="prevImage(${cardId}, ${images.length})">‹</button>
          <button class="gallery-nav next" onclick="nextImage(${cardId}, ${images.length})">›</button>
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
  
  const mainImg = document.getElementById(`main-img-${cardId}`);
  if (mainImg) {
    mainImg.src = `/${images[index]}`;
    mainImg.onclick = () => openModal(`/${images[index]}`);
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

// PRODUCTS - Flipkart/Amazon Style
fetch("/products")
  .then(r => r.json())
  .then(data => {
    let cardCounter = 0;
    document.getElementById("products").innerHTML =
      data.map(p => {
        const images = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
        const cardId = `product-${cardCounter++}`;
        galleryStates[cardId] = images;
        
        return `
          <div class="card product-card" data-id="${p.id}">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${p.name}</h4>
              ${p.description ? `<p class="card-description">${p.description}</p>` : ''}
              ${p.price ? `<p class="product-price">${p.price}</p>` : ''}
              <button class="enquire-btn" onclick="openOrderModal('${p.name.replace(/'/g, "\\'")}')">
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
        
        return `
          <div class="card work-card" data-id="${w.id}">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${w.title}</h4>
              ${w.description ? `<p class="card-description">${w.description}</p>` : ''}
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
        
        return `
          <div class="card achievement-card" data-id="${a.id}">
            ${createImageGallery(images, cardId)}
            <div class="card-content">
              <h4>${a.title}</h4>
              ${a.description ? `<p class="card-description">${a.description}</p>` : ''}
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
    
    if (storeNameEl) {
      storeNameEl.textContent = mainName.toUpperCase();
    }
    if (storeSubNameEl) {
      storeSubNameEl.textContent = subName;
    }
    
    // Only try to load logo if it exists in settings and is not empty
    if (settings.logo && settings.logo.trim() !== '') {
      const logoEl = document.getElementById("storeLogo");
      if (logoEl) {
        // Create a test image to check if the logo exists
        const testImg = new Image();
        testImg.onload = function() {
          // Only set the source if the image loads successfully
          logoEl.src = `/${settings.logo}`;
          logoEl.style.display = "block";
          logoEl.alt = `${storeName} Logo`;
        };
        testImg.onerror = function() {
          // Hide the logo element if the image fails to load
          logoEl.style.display = "none";
        };
        testImg.src = `/${settings.logo}`;
      }
    } else {
      // Hide the logo element if no logo is specified in settings
      const logoEl = document.getElementById("storeLogo");
      if (logoEl) {
        logoEl.style.display = "none";
      }
    }
  })
  .catch(err => console.error("Error loading settings:", err));

// ================= ORDER ENQUIRY SYSTEM =================

let selectedProductName = "";

// Initialize modal functionality
document.addEventListener('DOMContentLoaded', function() {
  // Close modal when clicking outside content
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeOrderModal();
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeOrderModal();
    }
  });
  
  // Initialize form validation
  const form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      submitOrder();
    });
    
    // Add input validation on blur
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
    });
  }
});

// Open modal
function openOrderModal(productName) {
  try {
    selectedProductName = productName;
    const modal = document.getElementById("orderModal");
    if (!modal) {
      console.error('Order modal element not found');
      return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set product name in modal
    const productTitle = document.getElementById("modalProductName");
    if (productTitle) {
      productTitle.textContent = productName;
    }
    
    // Set focus on first input field
    setTimeout(() => {
      const nameInput = document.getElementById("orderName");
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
    
  } catch (error) {
    console.error('Error opening order modal:', error);
    alert('Unable to open the order form. Please try again.');
  }
}

// Close modal
function closeOrderModal() {
  try {
    const modal = document.getElementById("orderModal");
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    // Reset form
    const form = document.getElementById("orderForm");
    if (form) {
      form.reset();
    }
    
    // Reset error states
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.style.display = 'none');
    
    const errorInputs = document.querySelectorAll('.error');
    errorInputs.forEach(el => el.classList.remove('error'));
    
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

// Validate form field
function validateField(field) {
  const errorElement = field.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) return true;
  
  let isValid = true;
  
  // Clear previous error
  field.classList.remove('error');
  errorElement.style.display = 'none';
  
  // Check required fields
  if (field.required && !field.value.trim()) {
    errorElement.textContent = 'This field is required';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  } 
  // Validate email format
  else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
    errorElement.textContent = 'Please enter a valid email address';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  }
  // Validate phone number format
  else if (field.id === 'orderPhone' && field.value && !/^[0-9]{10,15}$/.test(field.value)) {
    errorElement.textContent = 'Please enter a valid phone number (10-15 digits)';
    errorElement.style.display = 'block';
    field.classList.add('error');
    isValid = false;
  }
  
  return isValid;
}

// Submit order (WhatsApp-based)
function submitOrder() {
  try {
    // Get form elements
    const form = document.getElementById('orderForm');
    const nameInput = document.getElementById('orderName');
    const phoneInput = document.getElementById('orderPhone');
    const addressInput = document.getElementById('orderAddress');
    const submitBtn = document.getElementById('submitOrderBtn');
    
    if (!form || !nameInput || !phoneInput || !submitBtn) {
      throw new Error('Form elements not found');
    }
    
    // Validate all required fields
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      // Find first error and focus it
      const firstError = form.querySelector('.error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    
    // Get form values
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput ? addressInput.value.trim() : '';
    
    // Save button state
    const originalBtnText = submitBtn.querySelector('.btn-text').textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Opening WhatsApp...';
    
    // Use the admin's phone number from contact section
    const adminPhone = "7558450517"; // From dashboard.html contact section
    
    if (!adminPhone) {
      throw new Error('Admin WhatsApp number not configured. Please contact support.');
    }
    
    // Create WhatsApp message
    const message = `🔔 *New Product Enquiry* 🔔

*Product:* ${selectedProductName || 'Not specified'}
*Name:* ${name}
*Phone:* ${phone}
${address ? `*Address:* ${address}\n` : ''}

_${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}_`.trim();
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with pre-filled message
    const whatsappURL = `https://wa.me/${adminPhone}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappURL, '_blank');
    
    // Reset form and close modal
    form.reset();
    setTimeout(() => {
      closeOrderModal();
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('.btn-text').textContent = originalBtnText;
    }, 500);
    
  } catch (error) {
    console.error('Error submitting order:', error);
    alert(`Error: ${error.message || 'Failed to submit your enquiry. Please try again.'}`);
    
    // Reset button state
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      const btnText = submitBtn.querySelector('.btn-text');
      if (btnText) {
        btnText.textContent = 'Send Enquiry';
      }
    }
  }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Intersection Observer for fade-in animations on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all cards
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
