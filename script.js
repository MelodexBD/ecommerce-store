// =========================================
// MELODEX STORE - INSTANT FIRST-VISIT SCRIPT
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initializeFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ",
    authDomain: "melodex-store.firebaseapp.com",
    projectId: "melodex-store",
    storageBucket: "melodex-store.firebasestorage.app",
    messagingSenderId: "563447283369",
    appId: "1:563447283369:web:a999e89adf7380ec4733b8",
    measurementId: "G-G133358KKB"
};

const app = initializeApp(firebaseConfig);

// Ultra-fast HTTP Polling without stream overhead
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false
});

let products = [];
let cart = [];
const WHATSAPP_NUMBER = "8801310863206";

// 0-second skeleton display on very first visit
function renderInitialSkeletons() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];
    const skeletonHTML = `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line mid"></div>
                <div class="skeleton-line btn"></div>
            </div>
        </div>
    `.repeat(2);

    categories.forEach((cat) => {
        const el = document.getElementById(`${cat}Container`);
        if (el && el.innerHTML.trim() === "") {
            el.innerHTML = skeletonHTML;
        }
    });
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem("melodexCart");
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem("melodexCart", JSON.stringify(cart));
}

function normalizeCategory(category) {
    if (!category) return "guitars";
    const cat = category.toLowerCase().trim();
    if (cat.includes("guitar")) return "guitars";
    if (cat.includes("pedalboard")) return "pedalboards";
    if (cat.includes("pedal")) return "pedals";
    if (cat.includes("stand")) return "stands";
    if (cat.includes("cable") || cat.includes("accessories") || cat.includes("accessory")) return "cables";
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

async function fetchFirebaseProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const firebaseProducts = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let imageList = [];

            if (Array.isArray(data.images) && data.images.length > 0) {
                imageList = data.images.filter(img => img && img.trim() !== "");
            }

            if (imageList.length === 0 && data.image) {
                imageList = [data.image];
            }

            firebaseProducts.push({
                id: doc.id,
                name: data.name || "Unnamed Product",
                category: normalizeCategory(data.category),
                price: Number(data.price) || 0,
                image: imageList[0] || "",
                images: imageList,
                description: data.description || ""
            });
        });

        products = firebaseProducts;
        localStorage.setItem("melodex_cached_products", JSON.stringify(products));
        updateProductCount();
        displayProductsByCategory();
    } catch (error) {
        console.error("Firebase fetch error:", error);
    }
}

function updateProductCount() {
    const countElement = document.getElementById("total-products-count");
    if (countElement) {
        countElement.textContent = products.length > 0 ? `${products.length}+` : "0";
    }
}

function displayProductsByCategory() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];

    categories.forEach((category) => {
        const container = document.getElementById(`${category}Container`);
        if (!container) return;

        const categoryProducts = products.filter(p => p.category === category);
        container.innerHTML = "";

        if (categoryProducts.length === 0) {
            container.innerHTML = `<p class="no-products">No products available in this category yet.</p>`;
            return;
        }

        categoryProducts.forEach((product) => {
            let thumbnailsHTML = "";
            if (product.images && product.images.length > 1) {
                thumbnailsHTML = `<div class="product-thumbnails">`;
                product.images.forEach((imageUrl, index) => {
                    thumbnailsHTML += `
                        <img
                            src="${escapeHTML(imageUrl)}"
                            alt="${escapeHTML(product.name)}"
                            class="thumb-img ${index === 0 ? "active" : ""}"
                            data-product-id="${escapeHTML(product.id)}"
                            data-image="${escapeHTML(imageUrl)}"
                            loading="lazy"
                        >
                    `;
                });
                thumbnailsHTML += `</div>`;
            }

            const productHTML = `
                <div class="product-card">
                    <div class="product-image-wrapper">
                        <img
                            src="${escapeHTML(product.image)}"
                            alt="${escapeHTML(product.name)}"
                            class="product-image"
                            id="main-img-${escapeHTML(product.id)}"
                            data-product-id="${escapeHTML(product.id)}"
                            loading="lazy"
                        >
                        <button
                            class="image-zoom-btn"
                            data-product-id="${escapeHTML(product.id)}"
                            aria-label="View Image"
                        >
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>

                    ${thumbnailsHTML}

                    <div class="product-info">
                        <span class="product-category">
                            ${escapeHTML(getCategoryName(product.category))}
                        </span>
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
            container.insertAdjacentHTML("beforeend", productHTML);
        });
    });

    attachProductEvents();
}

function attachProductEvents() {
    document.querySelectorAll(".btn-add-cart").forEach((btn) => {
        btn.addEventListener("click", () => addToCart(btn.dataset.productId));
    });

    document.querySelectorAll("[data-order-product]").forEach((btn) => {
        btn.addEventListener("click", () => orderSingleProduct(btn.dataset.orderProduct));
    });

    document.querySelectorAll(".product-image").forEach((img) => {
        img.addEventListener("click", () => openImageModal(img.src, img.alt));
    });

    document.querySelectorAll(".image-zoom-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const mainImg = document.getElementById(`main-img-${btn.dataset.productId}`);
            if (mainImg) openImageModal(mainImg.src, mainImg.alt);
        });
    });

    document.querySelectorAll(".thumb-img").forEach((thumb) => {
        thumb.addEventListener("click", () => {
            const pid = thumb.dataset.productId;
            const imgUrl = thumb.dataset.image;
            const mainImg = document.getElementById(`main-img-${pid}`);

            if (mainImg) mainImg.src = imgUrl;

            const parent = thumb.parentElement;
            if (parent) {
                parent.querySelectorAll(".thumb-img").forEach(t => t.classList.remove("active"));
                thumb.classList.add("active");
            }
        });
    });
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
    const el = document.querySelector(".cart-count");
    if (!el) return;
    el.textContent = cart.reduce((tot, i) => tot + Number(i.quantity || 0), 0);
}

function renderCart() {
    const items = document.getElementById("cartItems");
    const empty = document.getElementById("cartEmpty");
    const footer = document.getElementById("cartFooter");
    const total = document.getElementById("cartTotal");

    if (!items || !empty || !footer || !total) return;

    if (cart.length === 0) {
        items.innerHTML = "";
        empty.style.display = "flex";
        footer.style.display = "none";
        total.textContent = "৳ 0";
        return;
    }

    empty.style.display = "none";
    footer.style.display = "block";
    items.innerHTML = "";

    cart.forEach((i) => {
        const sub = Number(i.price) * Number(i.quantity);
        items.insertAdjacentHTML("beforeend", `
            <div class="cart-item">
                <img src="${escapeHTML(i.image)}" alt="${escapeHTML(i.name)}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4>${escapeHTML(i.name)}</h4>
                    <span class="cart-item-price">৳ ${formatPrice(i.price)}</span>
                    <div class="cart-quantity">
                        <button class="quantity-btn" data-cart-action="decrease" data-product-id="${escapeHTML(i.id)}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${i.quantity}</span>
                        <button class="quantity-btn" data-cart-action="increase" data-product-id="${escapeHTML(i.id)}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <span class="cart-item-subtotal">৳ ${formatPrice(sub)}</span>
                </div>
                <button class="remove-cart-item" data-product-id="${escapeHTML(i.id)}" aria-label="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `);
    });

    const sum = cart.reduce((t, i) => t + (Number(i.price) * Number(i.quantity)), 0);
    total.textContent = `৳ ${formatPrice(sum)}`;

    document.querySelectorAll("[data-cart-action]").forEach(btn => {
        btn.addEventListener("click", () => changeCartQuantity(btn.dataset.productId, btn.dataset.cartAction));
    });
    document.querySelectorAll(".remove-cart-item").forEach(btn => {
        btn.addEventListener("click", () => removeCartItem(btn.dataset.productId));
    });
}

function changeCartQuantity(pid, act) {
    const item = cart.find(i => String(i.id) === String(pid));
    if (!item) return;

    if (act === "increase") item.quantity += 1;
    if (act === "decrease") {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(i => String(i.id) !== String(pid));
        }
    }
    saveCart();
    updateCart();
}

function removeCartItem(pid) {
    cart = cart.filter(i => String(i.id) !== String(pid));
    saveCart();
    updateCart();
    showNotification("Product removed from cart.", "success");
}

function openCart() {
    document.getElementById("cartSidebar")?.classList.add("active");
    document.getElementById("cartOverlay")?.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    document.getElementById("cartSidebar")?.classList.remove("active");
    document.getElementById("cartOverlay")?.classList.remove("active");
    document.body.style.overflow = "";
}

function orderSingleProduct(pid) {
    const p = products.find(item => String(item.id) === String(pid));
    if (!p) return;
    const msg = `Hello Melodex! 👋\n\nI want to order:\n\nProduct: ${p.name}\nPrice: ৳ ${formatPrice(p.price)}\n\nPlease let me know about availability and delivery.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

function checkoutCart() {
    if (cart.length === 0) return;
    let msg = "Hello Melodex! 👋\n\nI want to order these products:\n\n";
    let tot = 0;
    cart.forEach((i, idx) => {
        const sub = Number(i.price) * Number(i.quantity);
        tot += sub;
        msg += `${idx + 1}. ${i.name}\nQuantity: ${i.quantity}\nPrice: ৳ ${formatPrice(i.price)}\nSubtotal: ৳ ${formatPrice(sub)}\n\n`;
    });
    msg += `Total Amount: ৳ ${formatPrice(tot)}\n\nPlease confirm availability and delivery details.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

function openImageModal(url, alt) {
    const m = document.getElementById("imageModal");
    const img = document.getElementById("modalImage");
    if (!m || !img) return;
    img.src = url;
    img.alt = alt || "Product";
    m.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeImageModal() {
    document.getElementById("imageModal")?.classList.remove("active");
    document.body.style.overflow = "";
}

function showNotification(msg, type = "success") {
    const box = document.getElementById("notificationContainer");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.innerHTML = `<span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

function formatPrice(p) {
    return Number(p || 0).toLocaleString("en-BD");
}

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function initializeEvents() {
    document.getElementById("cartButton")?.addEventListener("click", openCart);
    document.getElementById("closeCart")?.addEventListener("click", closeCart);
    document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
    document.getElementById("checkoutButton")?.addEventListener("click", checkoutCart);
    document.getElementById("imageModalClose")?.addEventListener("click", closeImageModal);
    document.getElementById("imageModal")?.addEventListener("click", (e) => {
        if (e.target.id === "imageModal") closeImageModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { closeCart(); closeImageModal(); }
    });
}

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((l) => {
        l.addEventListener("click", function (e) {
            const h = this.getAttribute("href");
            if (!h || h === "#") return;
            const target = document.querySelector(h);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

async function initApp() {
    loadCart();
    updateCart();
    initializeEvents();
    initializeSmoothScroll();

    // Try Local Cache first
    const cached = localStorage.getItem("melodex_cached_products");
    if (cached) {
        products = JSON.parse(cached);
        updateProductCount();
        displayProductsByCategory();
    } else {
        // If first visit, show Skeleton Shimmer instantly (0.0s)
        renderInitialSkeletons();
    }

    // Direct background fast sync
    await fetchFirebaseProducts();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
