// =========================================
// MELODEX STORE
// ULTRA-FAST INDEXEDDB CACHE + FIRESTORE SYNC
// =========================================

const FIREBASE_PROJECT_ID = "melodex-store";
const FIREBASE_API_KEY = "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ";
const WHATSAPP_NUMBER = "8801310863206";

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/products`;

let products = [];
let cart = [];
let isSyncing = false;

// =========================================
// INDEXEDDB ENGINE (UNLIMITED CACHE STORAGE)
// =========================================
const DB_NAME = "MelodexCacheDB";
const DB_VERSION = 1;
const STORE_NAME = "productsStore";

function getDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            resolve(null);
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

async function getCachedProducts() {
    try {
        const db = await getDB();
        if (!db) return [];
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

async function saveProductsToCache(productList) {
    try {
        const db = await getDB();
        if (!db || !productList.length) return;
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        productList.forEach(item => store.put(item));
    } catch (e) {
        console.warn("IndexedDB cache save error:", e);
    }
}

// =========================================
// CATEGORY HELPERS
// =========================================
function normalizeCategory(category) {
    if (!category) return "guitars";
    const cat = String(category).toLowerCase().trim();
    if (cat.includes("guitar")) return "guitars";
    if (cat.includes("pedalboard")) return "pedalboards";
    if (cat.includes("pedal")) return "pedals";
    if (cat.includes("stand")) return "stands";
    if (cat.includes("cable") || cat.includes("accessori")) return "cables";
    return cat;
}

function getCategoryName(category) {
    const names = {
        guitars: "Guitars",
        pedals: "Pedals & Effects",
        pedalboards: "Pedalboards & Power",
        stands: "Stands",
        cables: "Cables & Accessories"
    };
    return names[category] || category;
}

// =========================================
// FIRESTORE PARSER
// =========================================
function firestoreValueToJS(value) {
    if (!value) return null;
    if ("stringValue" in value) return value.stringValue;
    if ("integerValue" in value) return Number(value.integerValue);
    if ("doubleValue" in value) return Number(value.doubleValue);
    if ("booleanValue" in value) return value.booleanValue;
    if ("arrayValue" in value) {
        const values = value.arrayValue.values || [];
        return values.map(item => firestoreValueToJS(item));
    }
    if ("mapValue" in value) {
        const result = {};
        const fields = value.mapValue.fields || {};
        Object.keys(fields).forEach(key => {
            result[key] = firestoreValueToJS(fields[key]);
        });
        return result;
    }
    if ("timestampValue" in value) return value.timestampValue;
    return null;
}

function convertFirestoreDocument(doc) {
    const fields = doc.fields || {};
    const data = {};
    Object.keys(fields).forEach(key => {
        data[key] = firestoreValueToJS(fields[key]);
    });

    let imageList = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
        imageList = data.images.filter(img => typeof img === "string" && img.trim() !== "");
    }
    if (imageList.length === 0 && data.image) {
        imageList = [data.image];
    }

    const docId = (doc.name || "").split("/").pop();

    return {
        id: docId,
        name: data.name || "Unnamed Product",
        category: normalizeCategory(data.category),
        price: Number(data.price) || 0,
        image: imageList[0] || "",
        images: imageList,
        description: data.description || ""
    };
}

// =========================================
// FIRESTORE BACKGROUND SYNC
// =========================================
async function syncFirebaseProducts() {
    if (isSyncing) return;
    isSyncing = true;

    try {
        const url = `${FIRESTORE_BASE_URL}?key=${encodeURIComponent(FIREBASE_API_KEY)}&pageSize=300`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const docs = result.documents || [];
        const freshProducts = docs.map(convertFirestoreDocument);

        // পরিবর্তন হয়েছে কি না যাচাই
        const hasChanged = JSON.stringify(freshProducts.map(p => p.id)) !== JSON.stringify(products.map(p => p.id)) ||
                           products.length !== freshProducts.length;

        if (hasChanged || products.length === 0) {
            products = freshProducts;
            updateProductCount();
            displayProductsByCategory();
            saveProductsToCache(products);
            console.log(`Melodex: Synced ${products.length} products with database.`);
        }
    } catch (err) {
        console.warn("Background sync offline/skipped:", err);
        if (products.length === 0) {
            showProductLoadError();
        }
    } finally {
        isSyncing = false;
    }
}

// =========================================
// CART STORAGE
// =========================================
function loadCart() {
    try {
        const saved = localStorage.getItem("melodexCart");
        cart = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(cart)) cart = [];
    } catch {
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem("melodexCart", JSON.stringify(cart));
    } catch (e) {
        console.warn("Cart save failed:", e);
    }
}

function updateCartCount() {
    const cartCount = document.querySelector(".cart-count");
    if (!cartCount) return;
    const totalQuantity = cart.reduce((tot, item) => tot + Number(item.quantity || 0), 0);
    cartCount.textContent = totalQuantity;
}

function updateProductCount() {
    const countElement = document.getElementById("total-products-count");
    if (countElement) {
        countElement.textContent = products.length > 0 ? `${products.length}+` : "0";
    }
}

// =========================================
// RENDER PRODUCTS
// =========================================
function showProductLoading() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];
    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (container && (!products || products.length === 0)) {
            container.innerHTML = `
                <div class="product-loading">
                    <div class="product-loader-spinner"></div>
                    <span>Loading products...</span>
                </div>
            `;
        }
    });
}

function showProductLoadError() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];
    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (container) {
            container.innerHTML = `
                <div class="product-loading">
                    <span>Unable to load products. Please check internet and refresh.</span>
                </div>
            `;
        }
    });
}

function displayProductsByCategory() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];

    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (!container) return;

        const categoryProducts = products.filter(p => p.category === category);

        if (categoryProducts.length === 0) {
            container.innerHTML = `<p class="no-products">No products available in this category yet.</p>`;
            return;
        }

        let productsHTML = "";
        categoryProducts.forEach((product, productIndex) => {
            let thumbnailsHTML = "";
            if (product.images && product.images.length > 1) {
                thumbnailsHTML = `<div class="product-thumbnails">`;
                product.images.forEach((imgUrl, index) => {
                    thumbnailsHTML += `
                        <img src="${escapeHTML(imgUrl)}"
                             alt="thumb"
                             class="thumb-img ${index === 0 ? 'active' : ''}"
                             data-product-id="${escapeHTML(product.id)}"
                             data-image="${escapeHTML(imgUrl)}"
                             loading="lazy"
                             decoding="async">
                    `;
                });
                thumbnailsHTML += `</div>`;
            }

            const imgLoading = productIndex < 4 ? "eager" : "lazy";
            const fetchPrio = productIndex < 2 ? "high" : "auto";

            productsHTML += `
                <div class="product-card">
                    <div class="product-image-wrapper">
                        <img src="${escapeHTML(product.image)}"
                             alt="${escapeHTML(product.name)}"
                             class="product-image"
                             id="main-img-${escapeHTML(product.id)}"
                             loading="${imgLoading}"
                             fetchpriority="${fetchPrio}"
                             decoding="async">
                        <button class="image-zoom-btn" data-product-id="${escapeHTML(product.id)}" aria-label="View Image">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    ${thumbnailsHTML}
                    <div class="product-info">
                        <span class="product-category">${escapeHTML(getCategoryName(product.category))}</span>
                        <h3 class="product-name">${escapeHTML(product.name)}</h3>
                        <p class="product-description">${escapeHTML(product.description)}</p>
                        <div class="product-price">৳ ${formatPrice(product.price)}</div>
                        <div class="product-actions">
                            <button class="btn-add-cart" data-product-id="${escapeHTML(product.id)}">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="btn btn-whatsapp" data-order-product="${escapeHTML(product.id)}">
                                <i class="fab fa-whatsapp"></i> Order Now
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = productsHTML;
    });
}

// =========================================
// EVENT DELEGATION
// =========================================
function initializeProductEvents() {
    document.addEventListener("click", event => {
        const cartBtn = event.target.closest(".btn-add-cart");
        if (cartBtn) {
            addToCart(cartBtn.dataset.productId);
            return;
        }

        const orderBtn = event.target.closest("[data-order-product]");
        if (orderBtn) {
            orderSingleProduct(orderBtn.dataset.orderProduct);
            return;
        }

        const zoomBtn = event.target.closest(".image-zoom-btn");
        if (zoomBtn) {
            const mainImg = document.getElementById(`main-img-${zoomBtn.dataset.productId}`);
            if (mainImg) openImageModal(mainImg.src, mainImg.alt);
            return;
        }

        const prodImg = event.target.closest(".product-image");
        if (prodImg) {
            openImageModal(prodImg.src, prodImg.alt);
            return;
        }

        const thumb = event.target.closest(".thumb-img");
        if (thumb) {
            const productId = thumb.dataset.productId;
            const imgURL = thumb.dataset.image;
            const mainImg = document.getElementById(`main-img-${productId}`);
            if (mainImg) mainImg.src = imgURL;

            const parent = thumb.parentElement;
            if (parent) {
                parent.querySelectorAll(".thumb-img").forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
            }
        }
    });
}

// =========================================
// CART LOGIC
// =========================================
function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existing = cart.find(i => String(i.id) === String(productId));
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    showNotification(`${product.name} added to cart!`, "success");
}

function updateCart() {
    updateCartCount();
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartFooter = document.getElementById("cartFooter");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems || !cartEmpty || !cartFooter || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = "";
        cartEmpty.style.display = "flex";
        cartFooter.style.display = "none";
        cartTotal.textContent = "৳ 0";
        return;
    }

    cartEmpty.style.display = "none";
    cartFooter.style.display = "block";

    let cartHTML = "";
    let totalPrice = 0;

    cart.forEach(item => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        totalPrice += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="cart-item-image" loading="lazy">
                <div class="cart-item-info">
                    <h4>${escapeHTML(item.name)}</h4>
                    <span class="cart-item-price">৳ ${formatPrice(item.price)}</span>
                    <div class="cart-quantity">
                        <button class="quantity-btn" data-cart-action="decrease" data-product-id="${escapeHTML(item.id)}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-cart-action="increase" data-product-id="${escapeHTML(item.id)}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <span class="cart-item-subtotal">৳ ${formatPrice(itemTotal)}</span>
                </div>
                <button class="remove-cart-item" data-product-id="${escapeHTML(item.id)}" aria-label="Remove Product">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    cartItems.innerHTML = cartHTML;
    cartTotal.textContent = `৳ ${formatPrice(totalPrice)}`;
}

function initializeCartEvents() {
    document.addEventListener("click", event => {
        const qBtn = event.target.closest("[data-cart-action]");
        if (qBtn) {
            changeCartQuantity(qBtn.dataset.productId, qBtn.dataset.cartAction);
            return;
        }

        const rmBtn = event.target.closest(".remove-cart-item");
        if (rmBtn) {
            removeCartItem(rmBtn.dataset.productId);
        }
    });
}

function changeCartQuantity(productId, action) {
    const item = cart.find(i => String(i.id) === String(productId));
    if (!item) return;

    if (action === "increase") item.quantity += 1;
    if (action === "decrease") {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(i => String(i.id) !== String(productId));
        }
    }
    saveCart();
    updateCart();
}

function removeCartItem(productId) {
    cart = cart.filter(i => String(i.id) !== String(productId));
    saveCart();
    updateCart();
    showNotification("Product removed from cart.", "success");
}

function openCart() {
    const s = document.getElementById("cartSidebar");
    const o = document.getElementById("cartOverlay");
    if (s && o) {
        s.classList.add("active");
        o.classList.add("active");
        updateBodyScrollLock();
    }
}

function closeCart() {
    const s = document.getElementById("cartSidebar");
    const o = document.getElementById("cartOverlay");
    if (s) s.classList.remove("active");
    if (o) o.classList.remove("active");
    updateBodyScrollLock();
}

// =========================================
// WHATSAPP ORDER
// =========================================
function orderSingleProduct(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;
    const msg = `Hello Melodex! 👋\n\nI want to order:\nProduct: ${product.name}\nPrice: ৳ ${formatPrice(product.price)}\n\nPlease let me know about availability and delivery.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

function checkoutCart() {
    if (cart.length === 0) {
        showNotification("Your cart is empty.", "error");
        return;
    }
    let msg = "Hello Melodex! 👋\n\nI want to order these products:\n\n";
    let total = 0;
    cart.forEach((item, index) => {
        const sub = Number(item.price) * Number(item.quantity);
        total += sub;
        msg += `${index + 1}. ${item.name}\nQuantity: ${item.quantity}\nPrice: ৳ ${formatPrice(item.price)}\nSubtotal: ৳ ${formatPrice(sub)}\n\n`;
    });
    msg += `Total Amount: ৳ ${formatPrice(total)}\n\nPlease confirm availability and delivery details.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

// =========================================
// MODAL & UTILITIES
// =========================================
function openImageModal(imgURL, altText) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    if (!modal || !modalImg) return;
    modalImg.src = imgURL;
    modalImg.alt = altText || "Product Image";
    modal.classList.add("active");
    updateBodyScrollLock();
}

function closeImageModal() {
    const modal = document.getElementById("imageModal");
    if (modal) modal.classList.remove("active");
    updateBodyScrollLock();
}

function updateBodyScrollLock() {
    const m = document.getElementById("imageModal");
    const c = document.getElementById("cartSidebar");
    const locked = (m && m.classList.contains("active")) || (c && c.classList.contains("active"));
    document.body.style.overflow = locked ? "hidden" : "";
}

function showNotification(message, type = "success") {
    const container = document.getElementById("notificationContainer");
    if (!container) return;
    const note = document.createElement("div");
    note.className = `notification ${type}`;
    note.textContent = message;
    container.appendChild(note);
    setTimeout(() => {
        note.classList.add("hide");
        setTimeout(() => note.remove(), 300);
    }, 2500);
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-BD");
}

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initializeEvents() {
    const cb = document.getElementById("cartButton");
    const ccb = document.getElementById("closeCart");
    const co = document.getElementById("cartOverlay");
    const chb = document.getElementById("checkoutButton");
    const imc = document.getElementById("imageModalClose");
    const im = document.getElementById("imageModal");

    if (cb) cb.addEventListener("click", openCart);
    if (ccb) ccb.addEventListener("click", closeCart);
    if (co) co.addEventListener("click", closeCart);
    if (chb) chb.addEventListener("click", checkoutCart);
    if (imc) imc.addEventListener("click", closeImageModal);
    if (im) {
        im.addEventListener("click", e => {
            if (e.target === im) closeImageModal();
        });
    }

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeCart();
            closeImageModal();
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function(e) {
            const href = this.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

// =========================================
// APP INITIALIZATION
// =========================================
async function initApp() {
    loadCart();
    updateCart();
    initializeEvents();
    initializeProductEvents();
    initializeCartEvents();

    // ১. IndexedDB থেকে সাথে সাথে (০.০১ সেকেন্ডে) ক্যাশ তুলে আনা
    const cached = await getCachedProducts();
    if (cached && cached.length > 0) {
        products = cached;
        updateProductCount();
        displayProductsByCategory();
        console.log(`Melodex: Instant render from IndexedDB (${products.length} products).`);
    } else {
        showProductLoading();
    }

    // ২. ব্যাকগ্রাউন্ডে নীরবে ফায়ারবেজ সিঙ্ক
    syncFirebaseProducts();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
