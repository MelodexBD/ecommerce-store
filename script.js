// =========================================
// MELODEX STORE
// FAST SDK LOADING + REALTIME CACHE + SYNC
// PRODUCT DETAILS + PUBLIC PRODUCT LINKS
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
    initializeFirestore,
    collection,
    getDocs,
    getDocsFromCache,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// =========================================
// FIREBASE CONFIGURATION
// =========================================

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

// =========================================
// FIREBASE INITIALIZATION
// =========================================

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
    cacheSizeBytes: 40 * 1024 * 1024
});

enableIndexedDbPersistence(db).catch(() => {
    // Multiple tabs / unsupported browser fallback
});

// =========================================
// GLOBAL VARIABLES
// =========================================

let products = [];
let cart = [];

let currentDetailProduct = null;
let productDetailModal = null;

const PRODUCT_CACHE_KEY = "melodex-products-v2";
const PRODUCT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const PRODUCT_CATEGORIES = [
    "guitars",
    "pedals",
    "pedalboards",
    "stands",
    "cables"
];

// =========================================
// CATEGORY HELPERS
// =========================================

function normalizeCategory(category) {
    if (!category) {
        return "guitars";
    }

    const cat = String(category).toLowerCase().trim();

    if (cat.includes("guitar")) {
        return "guitars";
    }
    if (cat.includes("pedalboard")) {
        return "pedalboards";
    }
    if (cat.includes("pedal")) {
        return "pedals";
    }
    if (cat.includes("stand")) {
        return "stands";
    }
    if (cat.includes("cable") || cat.includes("accessori")) {
        return "cables";
    }

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
// PUBLIC PRODUCT URL
// =========================================

function getPublicProductUrl(productId) {
    if (!productId) {
        return window.location.href;
    }

    const productUrl = new URL("./", window.location.href);
    productUrl.search = "";
    productUrl.hash = "";
    productUrl.searchParams.set("product", productId);

    return productUrl.href;
}

// =========================================
// FETCH PRODUCTS FROM FIREBASE
// =========================================

function isSafeImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    // Base64 Data URL সমর্থন
    if (value.startsWith("data:image/")) {
        return true;
    }

    try {
        const url = new URL(value, window.location.origin);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function normalizeProduct(id, data) {
    const imageList = Array.isArray(data.images)
        ? data.images.filter(isSafeImageUrl)
        : [];

    if (imageList.length === 0 && isSafeImageUrl(data.image)) {
        imageList.push(data.image);
    }

    return {
        id: String(id),
        name: String(data.name || "Unnamed Product").trim().slice(0, 160),
        category: normalizeCategory(data.category),
        price: Math.max(0, Number(data.price) || 0),
        image: imageList[0] || "",
        images: imageList,
        description: String(data.description || "").trim().slice(0, 2000)
    };
}

function productsFromSnapshot(querySnapshot) {
    return querySnapshot.docs
        .map(docSnap => normalizeProduct(docSnap.id, docSnap.data()))
        .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function readProductCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY));

        if (!cached || !Array.isArray(cached.products) ||
            Date.now() - cached.savedAt > PRODUCT_CACHE_MAX_AGE) {
            return [];
        }

        return cached.products.map(product => normalizeProduct(product.id, product));
    } catch {
        return [];
    }
}

function writeProductCache(items) {
    try {
        localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
            savedAt: Date.now(),
            products: items
        }));
    } catch {
        // Storage fallback
    }
}

function renderProducts(items) {
    products = items;
    updateProductCount();
    displayProductsByCategory();
    initializeProductDetailFromUrl();
}

async function fetchProducts() {
    const cachedProducts = readProductCache();

    if (cachedProducts.length > 0) {
        renderProducts(cachedProducts);
    } else {
        showProductLoading();
        try {
            const snapshot = await getDocsFromCache(collection(db, "products"));
            const persistedProducts = productsFromSnapshot(snapshot);
            if (persistedProducts.length > 0) {
                renderProducts(persistedProducts);
            }
        } catch {
            // No cache
        }
    }

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const freshProducts = productsFromSnapshot(querySnapshot);

        writeProductCache(freshProducts);

        if (JSON.stringify(freshProducts) !== JSON.stringify(products)) {
            renderProducts(freshProducts);
        }

        console.log(`Melodex: ${freshProducts.length} products synced.`);
    } catch (error) {
        console.error("Firebase fetch error:", error);

        if (products.length === 0) {
            showProductLoadError();
        }
    }
}

// =========================================
// PRODUCT COUNT
// =========================================

function updateProductCount() {
    const countElements = [
        document.getElementById("total-products-count"),
        document.getElementById("productCount")
    ];

    countElements.forEach(element => {
        if (!element) return;
        element.textContent = products.length > 0 ? `${products.length}+` : "0";
    });
}

// =========================================
// PRODUCT LOADING UI
// =========================================

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

// =========================================
// PRODUCT LOAD ERROR
// =========================================

function showProductLoadError() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];

    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (container && products.length === 0) {
            container.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">
                    প্রোডাক্ট লোড করা সম্ভব হয়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
                </p>
            `;
        }
    });
}

// =========================================
// DISPLAY PRODUCTS
// =========================================

function displayProductsByCategory() {
    const categories = ["guitars", "pedals", "pedalboards", "stands", "cables"];

    categories.forEach(category => {
        const container = document.getElementById(`${category}Container`);
        if (!container) return;

        const categoryProducts = products.filter(product => product.category === category);

        if (categoryProducts.length === 0) {
            container.innerHTML = `
                <p class="no-products" style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">
                    এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই।
                </p>
            `;
            return;
        }

        let productsHTML = "";

        categoryProducts.forEach((product, productIndex) => {
            let thumbnailsHTML = "";

            if (product.images && product.images.length > 1) {
                thumbnailsHTML = `<div class="product-thumbnails">`;
                product.images.forEach((imgUrl, index) => {
                    thumbnailsHTML += `
                        <img
                            src="${escapeHTML(imgUrl)}"
                            alt="${escapeHTML(product.name)} thumbnail"
                            class="thumb-img ${index === 0 ? "active" : ""}"
                            data-product-id="${escapeHTML(product.id)}"
                            data-image="${escapeHTML(imgUrl)}"
                            loading="lazy"
                        >
                    `;
                });
                thumbnailsHTML += `</div>`;
            }

            const isPriorityImage = category === "guitars" && productIndex < 2;

            const mainImageHTML = product.image
                ? `
                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        class="product-image"
                        id="main-img-${escapeHTML(product.id)}"
                        loading="${isPriorityImage ? "eager" : "lazy"}"
                        decoding="async"
                        onload="this.classList.add('img-ready'); this.parentElement.classList.remove('img-loading');"
                        onerror="this.parentElement.classList.remove('img-loading');"
                    >
                `
                : `
                    <div class="product-image product-image-placeholder" role="img" aria-label="No image available">
                        <i class="fas fa-image" aria-hidden="true"></i>
                        <span>Image coming soon</span>
                    </div>
                `;

            productsHTML += `
                <div class="product-card" data-product-card="${escapeHTML(product.id)}">
                    <div class="product-image-wrapper ${product.image ? 'img-loading' : ''}">
                        ${mainImageHTML}
                        <button class="image-zoom-btn" data-product-id="${escapeHTML(product.id)}" aria-label="View Image" type="button">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    ${thumbnailsHTML}
                    <div class="product-info">
                        <span class="product-category">${escapeHTML(getCategoryName(product.category))}</span>
                        <h3 class="product-name product-detail-link" data-product-detail="${escapeHTML(product.id)}" title="View Product Details" tabindex="0" role="button">
                            ${escapeHTML(product.name)}
                        </h3>
                        <p class="product-description">${escapeHTML(product.description)}</p>
                        <div class="product-price">৳ ${formatPrice(product.price)}</div>
                        <div class="product-actions">
                            <button class="btn-add-cart" data-product-id="${escapeHTML(product.id)}" type="button">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="btn btn-whatsapp" data-order-product="${escapeHTML(product.id)}" type="button">
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
// PRODUCT EVENT DELEGATION
// =========================================

function initializeProductEvents() {
    document.addEventListener("error", event => {
        if (!(event.target instanceof HTMLImageElement) || !event.target.matches(".product-image")) {
            return;
        }
        event.target.alt = "Product image unavailable";
        event.target.closest(".product-image-wrapper")?.classList.add("image-unavailable");
    }, true);

    document.addEventListener("click", event => {
        const detailBtn = event.target.closest("[data-product-detail]");
        if (detailBtn) {
            openProductDetail(detailBtn.dataset.productDetail, true);
            return;
        }

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
            if (mainImg) {
                openImageModal(mainImg.src, mainImg.alt);
            }
            return;
        }

        const prodImg = event.target.closest(".product-image");
        if (prodImg instanceof HTMLImageElement) {
            openImageModal(prodImg.src, prodImg.alt);
            return;
        }

        const thumb = event.target.closest(".thumb-img");
        if (thumb) {
            const productId = thumb.dataset.productId;
            const imgURL = thumb.dataset.image;
            const mainImg = document.getElementById(`main-img-${productId}`);
            if (mainImg) {
                mainImg.src = imgURL;
            }

            const parent = thumb.parentElement;
            if (parent) {
                parent.querySelectorAll(".thumb-img").forEach(item => item.classList.remove("active"));
                thumb.classList.add("active");
            }
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const detailBtn = event.target.closest("[data-product-detail]");
        if (!detailBtn) return;
        event.preventDefault();
        openProductDetail(detailBtn.dataset.productDetail, true);
    });
}

// =========================================
// CART LOAD & SAVE
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
    } catch (error) {
        console.warn("Cart save failed:", error);
    }
}

// =========================================
// CART ACTIONS
// =========================================

function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existing = cart.find(item => String(item.id) === String(productId));
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

    const totalQuantity = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
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
                        <button class="quantity-btn" data-cart-action="decrease" data-product-id="${escapeHTML(item.id)}" type="button">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-cart-action="increase" data-product-id="${escapeHTML(item.id)}" type="button">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <span class="cart-item-subtotal">৳ ${formatPrice(itemTotal)}</span>
                </div>
                <button class="remove-cart-item" data-product-id="${escapeHTML(item.id)}" aria-label="Remove Product" type="button">
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
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    if (sidebar && overlay) {
        sidebar.classList.add("active");
        overlay.classList.add("active");
        updateBodyScrollLock();
    }
}

function closeCart() {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    updateBodyScrollLock();
}

function orderSingleProduct(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const msg = `Hello Melodex! 👋\n\nI want to order:\n\nProduct: ${product.name}\nPrice: ৳ ${formatPrice(product.price)}\n\nPlease let me know about availability and delivery.`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
}

function checkoutCart() {
    if (cart.length === 0) {
        showNotification("Your cart is empty.", "error");
        return;
    }

    let msg = "Hello Melodex! 👋\n\nI want to order these products:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = Number(item.price) * Number(item.quantity);
        total += subtotal;
        msg += `${index + 1}. ${item.name}\nQuantity: ${item.quantity}\nPrice: ৳ ${formatPrice(item.price)}\nSubtotal: ৳ ${formatPrice(subtotal)}\n\n`;
    });

    msg += `Total Amount: ৳ ${formatPrice(total)}\n\nPlease confirm availability and delivery details.`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
}

// =========================================
// IMAGE MODAL
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

// =========================================
// CREATE PRODUCT DETAIL MODAL
// =========================================

function createProductDetailModal() {
    const existing = document.getElementById("productDetailModal");
    if (existing) {
        productDetailModal = existing;
        return;
    }

    const modal = document.createElement("div");
    modal.id = "productDetailModal";
    modal.className = "product-detail-modal";
    modal.innerHTML = `
        <div class="product-detail-overlay" data-detail-close="true"></div>
        <div class="product-detail-box" role="dialog" aria-modal="true" aria-labelledby="detailProductName">
            <button type="button" class="product-detail-close" id="productDetailClose" aria-label="Close Product Details">
                <i class="fas fa-times"></i>
            </button>
            <div class="product-detail-content">
                <div class="product-detail-gallery">
                    <div class="product-detail-main-image-wrapper">
                        <img id="detailMainImage" class="product-detail-main-image" src="" alt="">
                        <button type="button" class="product-detail-image-zoom" id="detailImageZoom" aria-label="Zoom Image">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    <div class="product-detail-thumbnails" id="detailThumbnails"></div>
                </div>
                <div class="product-detail-info">
                    <span class="product-detail-category" id="detailProductCategory"></span>
                    <h2 id="detailProductName" class="product-detail-name"></h2>
                    <div id="detailProductPrice" class="product-detail-price"></div>
                    <div class="product-detail-divider"></div>
                    <div class="product-detail-description-title">Product Description</div>
                    <p id="detailProductDescription" class="product-detail-description"></p>
                    <div class="product-detail-actions">
                        <button type="button" class="detail-cart-btn" id="detailAddCart">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button type="button" class="detail-whatsapp-btn" id="detailWhatsApp">
                            <i class="fab fa-whatsapp"></i> Order on WhatsApp
                        </button>
                    </div>
                    <div class="product-detail-share">
                        <span>Share Product</span>
                        <button type="button" class="product-detail-copy-link" id="detailCopyLink">
                            <i class="fas fa-link"></i> Copy Product Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    productDetailModal = modal;
}

// =========================================
// OPEN PRODUCT DETAIL
// =========================================

function openProductDetail(productId, updateUrl = true) {
    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
        showNotification("Product not found.", "error");
        if (new URLSearchParams(window.location.search).has("product")) {
            removeProductQuery(true);
        }
        return;
    }

    createProductDetailModal();
    currentDetailProduct = product;

    const modal = productDetailModal;
    const mainImage = document.getElementById("detailMainImage");
    const category = document.getElementById("detailProductCategory");
    const name = document.getElementById("detailProductName");
    const price = document.getElementById("detailProductPrice");
    const description = document.getElementById("detailProductDescription");
    const thumbnails = document.getElementById("detailThumbnails");

    if (!modal || !mainImage || !category || !name || !price || !description || !thumbnails) {
        return;
    }

    // =====================================
    // PRODUCT DATA & PRELOAD EFFECT
    // =====================================

    const imageList = product.images && product.images.length > 0
        ? product.images
        : product.image
            ? [product.image]
            : [];

    const imgWrapper = mainImage.closest('.product-detail-main-image-wrapper');
    if (imgWrapper) imgWrapper.classList.add('img-loading');
    mainImage.classList.remove('img-ready');

    if (imageList[0]) {
        const tempImg = new Image();
        tempImg.src = imageList[0];

        tempImg.onload = () => {
            mainImage.src = imageList[0];
            mainImage.alt = product.name;
            mainImage.classList.add('img-ready');
            if (imgWrapper) imgWrapper.classList.remove('img-loading');
        };

        tempImg.onerror = () => {
            if (imgWrapper) imgWrapper.classList.remove('img-loading');
        };

        if (tempImg.complete) {
            tempImg.onload();
        }
    } else {
        if (imgWrapper) imgWrapper.classList.remove('img-loading');
    }

    category.textContent = getCategoryName(product.category);
    name.textContent = product.name;
    price.textContent = `৳ ${formatPrice(product.price)}`;
    description.textContent = product.description || "No product description available.";

    // =====================================
    // THUMBNAILS
    // =====================================

    thumbnails.innerHTML = "";

    imageList.forEach((imageUrl, index) => {
        const thumb = document.createElement("img");
        thumb.src = imageUrl;
        thumb.alt = `${product.name} image ${index + 1}`;
        thumb.className = `detail-thumb ${index === 0 ? "active" : ""}`;
        thumb.dataset.image = imageUrl;

        thumb.addEventListener("click", () => {
            if (imgWrapper) imgWrapper.classList.add('img-loading');
            mainImage.classList.remove('img-ready');

            const tempThumbImg = new Image();
            tempThumbImg.src = imageUrl;
            tempThumbImg.onload = () => {
                mainImage.src = imageUrl;
                mainImage.classList.add('img-ready');
                if (imgWrapper) imgWrapper.classList.remove('img-loading');
            };
            if (tempThumbImg.complete) {
                tempThumbImg.onload();
            }

            thumbnails.querySelectorAll(".detail-thumb").forEach(item => item.classList.remove("active"));
            thumb.classList.add("active");
        });

        thumbnails.appendChild(thumb);
    });

    modal.classList.add("active");
    updateBodyScrollLock();

    if (updateUrl) {
        const newUrl = getPublicProductUrl(product.id);
        if (window.location.href !== newUrl) {
            window.history.pushState({ productId: product.id }, "", newUrl);
        }
    }
}

// =========================================
// CLOSE PRODUCT DETAIL
// =========================================

function closeProductDetail(removeUrl = true) {
    const modal = document.getElementById("productDetailModal");
    if (modal) modal.classList.remove("active");

    currentDetailProduct = null;
    updateBodyScrollLock();

    if (removeUrl && new URLSearchParams(window.location.search).has("product")) {
        removeProductQuery(true);
    }
}

function removeProductQuery(useReplaceState = true) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("product")) return;

    params.delete("product");
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "") + window.location.hash;

    if (useReplaceState) {
        window.history.replaceState({}, "", cleanUrl);
    } else {
        window.history.pushState({}, "", cleanUrl);
    }
}

// =========================================
// PRODUCT DETAIL EVENTS
// =========================================

function initializeProductDetailEvents() {
    createProductDetailModal();

    const modal = document.getElementById("productDetailModal");
    const closeBtn = document.getElementById("productDetailClose");
    const addCartBtn = document.getElementById("detailAddCart");
    const whatsappBtn = document.getElementById("detailWhatsApp");
    const copyLinkBtn = document.getElementById("detailCopyLink");
    const zoomBtn = document.getElementById("detailImageZoom");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => closeProductDetail(true));
    }

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target.dataset.detailClose === "true") {
                closeProductDetail(true);
            }
        });
    }

    if (addCartBtn) {
        addCartBtn.addEventListener("click", () => {
            if (currentDetailProduct) {
                addToCart(currentDetailProduct.id);
            }
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", () => {
            if (currentDetailProduct) {
                orderSingleProduct(currentDetailProduct.id);
            }
        });
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener("click", copyCurrentProductLink);
    }

    if (zoomBtn) {
        zoomBtn.addEventListener("click", () => {
            if (!currentDetailProduct) return;
            const mainImage = document.getElementById("detailMainImage");
            if (mainImage && mainImage.src) {
                openImageModal(mainImage.src, mainImage.alt);
            }
        });
    }
}

// =========================================
// COPY CURRENT PRODUCT LINK
// =========================================

async function copyCurrentProductLink() {
    if (!currentDetailProduct) return;
    const url = getPublicProductUrl(currentDetailProduct.id);

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = url;
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            textarea.style.top = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
        showNotification("Product link copied!", "success");
    } catch (error) {
        console.error("Copy link failed:", error);
        showNotification("Link copy করা যায়নি।", "error");
    }
}

function initializeProductDetailFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product");
    if (!productId) return;

    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
        openProductDetail(product.id, false);
    } else {
        showNotification("Product not found.", "error");
        removeProductQuery(true);
    }
}

// =========================================
// BODY SCROLL LOCK
// =========================================

function updateBodyScrollLock() {
    const imageModal = document.getElementById("imageModal");
    const cartSidebar = document.getElementById("cartSidebar");
    const detailModal = document.getElementById("productDetailModal");

    const locked =
        (imageModal && imageModal.classList.contains("active")) ||
        (cartSidebar && cartSidebar.classList.contains("active")) ||
        (detailModal && detailModal.classList.contains("active"));

    document.body.style.overflow = locked ? "hidden" : "";
}

// =========================================
// NOTIFICATION
// =========================================

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

// =========================================
// UTILITIES
// =========================================

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

// =========================================
// GENERAL EVENTS
// =========================================

function initializeEvents() {
    const cartButton = document.getElementById("cartButton");
    const closeCartButton = document.getElementById("closeCart");
    const cartOverlay = document.getElementById("cartOverlay");
    const checkoutButton = document.getElementById("checkoutButton");
    const imageModalClose = document.getElementById("imageModalClose");
    const imageModal = document.getElementById("imageModal");

    if (cartButton) cartButton.addEventListener("click", openCart);
    if (closeCartButton) closeCartButton.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
    if (checkoutButton) checkoutButton.addEventListener("click", checkoutCart);

    if (imageModalClose) imageModalClose.addEventListener("click", closeImageModal);
    if (imageModal) {
        imageModal.addEventListener("click", event => {
            if (event.target === imageModal) closeImageModal();
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        const detailModal = document.getElementById("productDetailModal");
        if (detailModal && detailModal.classList.contains("active")) {
            closeProductDetail(true);
            return;
        }

        const imageModal = document.getElementById("imageModal");
        if (imageModal && imageModal.classList.contains("active")) {
            closeImageModal();
            return;
        }

        const cartSidebar = document.getElementById("cartSidebar");
        if (cartSidebar && cartSidebar.classList.contains("active")) {
            closeCart();
        }
    });

    window.addEventListener("popstate", () => {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("product");

        if (productId) {
            const product = products.find(p => String(p.id) === String(productId));
            if (product) {
                openProductDetail(product.id, false);
            } else {
                const detailModal = document.getElementById("productDetailModal");
                if (detailModal) detailModal.classList.remove("active");
                currentDetailProduct = null;
                updateBodyScrollLock();
            }
        } else {
            const detailModal = document.getElementById("productDetailModal");
            if (detailModal) detailModal.classList.remove("active");
            currentDetailProduct = null;
            updateBodyScrollLock();
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (!href || href === "#") return;

            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
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
    initializeProductDetailEvents();

    await fetchProducts();
}

// =========================================
// START APP
// =========================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
