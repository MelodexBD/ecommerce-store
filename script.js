// =========================================
// MELODEX STORE
// FAST SDK LOADING + REALTIME CACHE + SYNC
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
    initializeFirestore, 
    collection, 
    getDocs, 
    enableIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ",
    authDomain: "melodex-store.firebaseapp.com",
    projectId: "melodex-store",
    storageBucket: "melodex-store.firebasestorage.app",
    messagingSenderId: "563447283369",
    appId: "1:563447283369:web:a999e89adf7380ec4733b8",
    measurementId: "G-G133358KKB"
};

const WHATSAPP_NUMBER = "8801310863206";
const app = initializeApp(firebaseConfig);

// মেসেঞ্জার ও মোবাইল ব্রাউজারে ব্লকিং ছাড়া চলার কনফিগারেশন
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

// ফায়ারবেজের বিল্ট-ইন সুপারফাস্ট IndexedDB অফলাইন ক্যাশ চালু
enableIndexedDbPersistence(db).catch(() => {
    // মাল্টিপল ট্যাব খোলা থাকলে ক্যাশ ফলব্যাক নীরবে হ্যান্ডেল করবে
});

let products = [];
let cart = [];

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
    return "guitars";
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
// FETCH PRODUCTS (FIREBASE SDK)
// =========================================
async function fetchProducts() {
    showProductLoading();
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fbProducts = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let imageList = [];
            if (Array.isArray(data.images) && data.images.length > 0) {
                imageList = data.images.filter(img => typeof img === "string" && img.trim() !== "");
            }
            if (imageList.length === 0 && data.image) {
                imageList = [data.image];
            }

            fbProducts.push({
                id: doc.id,
                name: data.name || "Unnamed Product",
                category: normalizeCategory(data.category),
                price: Number(data.price) || 0,
                image: imageList[0] || "",
                images: imageList,
                description: data.description || ""
            });
        });

        products = fbProducts;
        updateProductCount();
        displayProductsByCategory();
        console.log(`Melodex: ${products.length} products loaded successfully.`);
    } catch (error) {
        console.error("Firebase fetch error:", error);
        showProductLoadError();
    }
}

// =========================================
// UI DISPLAY & LOADERS
// =========================================
function updateProductCount() {
    const countElement = document.getElementById("total-products-count");
    if (countElement) {
        countElement.textContent = products.length > 0 ? `${products.length}+` : "0";
    }
}

function showProductLoading() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];
    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (container && products.length === 0) {
            container.innerHTML = `
                <div class="product-loading" style="grid-column: 1/-1; text-align: center; padding: 30px; color: #94a3b8;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #ef4444; margin-bottom: 8px;"></i>
                    <p>Loading products...</p>
                </div>
            `;
        }
    });
}

function showProductLoadError() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];
    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (container && products.length === 0) {
            container.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">
                    প্রোডাক্ট লোড করা সম্ভব হয়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
                </p>
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
            container.innerHTML = `<p class="no-products" style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই।</p>`;
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
                             loading="lazy">
                    `;
                });
                thumbnailsHTML += `</div>`;
            }

            const imgLoading = productIndex < 4 ? "eager" : "lazy";

            productsHTML += `
                <div class="product-card">
                    <div class="product-image-wrapper">
                        <img src="${escapeHTML(product.image)}"
                             alt="${escapeHTML(product.name)}"
                             class="product-image"
                             id="main-img-${escapeHTML(product.id)}"
                             loading="${imgLoading}">
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

function updateCartCount() {
    const cartCount = document.querySelector(".cart-count");
    if (!cartCount) return;
    const totalQuantity = cart.reduce((tot, item) => tot + Number(item.quantity || 0), 0);
    cartCount.textContent = totalQuantity;
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
function initApp() {
    loadCart();
    updateCart();
    initializeEvents();
    initializeProductEvents();
    initializeCartEvents();

    fetchProducts();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
