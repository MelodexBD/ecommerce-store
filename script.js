// =========================================
// MELODEX STORE - FINAL ROBUST SCRIPT
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

// Force long polling to bypass Messenger/Facebook in-app browser restrictions
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

let products = [];
let cart = [];
const WHATSAPP_NUMBER = "8801310863206";

function loadCart() {
    try {
        const savedCart = localStorage.getItem("melodexCart");
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        console.error("Cart load error:", error);
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
                imageList = data.images.filter(image => image && image.trim() !== "");
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
        updateProductCount();
        displayProductsByCategory();
    } catch (error) {
        console.error("Firebase product fetch failed:", error);
        showNotification("Products could not be loaded.", "error");
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

        const categoryProducts = products.filter(product => product.category === category);
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
                        <h3 class="product-name">
                            ${escapeHTML(product.name)}
                        </h3>
                        <p class="product-description">
                            ${escapeHTML(product.description)}
                        </p>
                        <div class="product-price">
                            ৳ ${formatPrice(product.price)}
                        </div>
                        <div class="product-actions">
                            <button
                                class="btn-add-cart"
                                data-product-id="${escapeHTML(product.id)}"
                            >
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button
                                class="btn btn-whatsapp"
                                data-order-product="${escapeHTML(product.id)}"
                            >
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
    document.querySelectorAll(".btn-add-cart").forEach((button) => {
        button.addEventListener("click", () => addToCart(button.dataset.productId));
    });

    document.querySelectorAll("[data-order-product]").forEach((button) => {
        button.addEventListener("click", () => orderSingleProduct(button.dataset.orderProduct));
    });

    document.querySelectorAll(".product-image").forEach((image) => {
        image.addEventListener("click", () => openImageModal(image.src, image.alt));
    });

    document.querySelectorAll(".image-zoom-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const mainImage = document.getElementById(`main-img-${button.dataset.productId}`);
            if (mainImage) openImageModal(mainImage.src, mainImage.alt);
        });
    });

    document.querySelectorAll(".thumb-img").forEach((thumbnail) => {
        thumbnail.addEventListener("click", () => {
            const productId = thumbnail.dataset.productId;
            const imageURL = thumbnail.dataset.image;
            const mainImage = document.getElementById(`main-img-${productId}`);

            if (mainImage) {
                mainImage.src = imageURL;
            }

            const parent = thumbnail.parentElement;
            if (parent) {
                parent.querySelectorAll(".thumb-img").forEach(thumb => thumb.classList.remove("active"));
                thumbnail.classList.add("active");
            }
        });
    });
}

function addToCart(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existingItem = cart.find(item => String(item.id) === String(productId));
    if (existingItem) {
        existingItem.quantity += 1;
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
    cartItems.innerHTML = "";

    cart.forEach((item) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        const cartItemHTML = `
            <div class="cart-item">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="cart-item-image">
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
        cartItems.insertAdjacentHTML("beforeend", cartItemHTML);
    });

    const totalPrice = cart.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
    cartTotal.textContent = `৳ ${formatPrice(totalPrice)}`;
    attachCartItemEvents();
}

function attachCartItemEvents() {
    document.querySelectorAll("[data-cart-action]").forEach((button) => {
        button.addEventListener("click", () => {
            changeCartQuantity(button.dataset.productId, button.dataset.cartAction);
        });
    });

    document.querySelectorAll(".remove-cart-item").forEach((button) => {
        button.addEventListener("click", () => {
            removeCartItem(button.dataset.productId);
        });
    });
}

function changeCartQuantity(productId, action) {
    const item = cart.find(item => String(item.id) === String(productId));
    if (!item) return;

    if (action === "increase") item.quantity += 1;
    if (action === "decrease") {
        item.quantity -= 1;
        if (item.quantity <= 0) {
            cart = cart.filter(item => String(item.id) !== String(productId));
        }
    }

    saveCart();
    updateCart();
}

function removeCartItem(productId) {
    cart = cart.filter(item => String(item.id) !== String(productId));
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
        document.body.style.overflow = "hidden";
    }
}

function closeCart() {
    const sidebar = document.getElementById("cartSidebar");
    const overlay = document.getElementById("cartOverlay");
    if (sidebar && overlay) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function orderSingleProduct(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const message = `Hello Melodex! 👋\n\nI want to order:\n\nProduct: ${product.name}\nPrice: ৳ ${formatPrice(product.price)}\n\nPlease let me know about availability and delivery.`;
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
}

function checkoutCart() {
    if (cart.length === 0) {
        showNotification("Your cart is empty.", "error");
        return;
    }

    let message = "Hello Melodex! 👋\n\nI want to order these products:\n\n";
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const subtotal = Number(item.price) * Number(item.quantity);
        totalPrice += subtotal;
        message += `${index + 1}. ${item.name}\nQuantity: ${item.quantity}\nPrice: ৳ ${formatPrice(item.price)}\nSubtotal: ৳ ${formatPrice(subtotal)}\n\n`;
    });

    message += `Total Amount: ৳ ${formatPrice(totalPrice)}\n\nPlease confirm availability and delivery details.`;
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
}

function openImageModal(imageURL, altText) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    if (!modal || !modalImage) return;

    modalImage.src = imageURL;
    modalImage.alt = altText || "Product Image";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeImageModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function showNotification(message, type = "success") {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    container.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("hide");
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-BD");
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initializeEvents() {
    const cartButton = document.getElementById("cartButton");
    const closeCartButton = document.getElementById("closeCart");
    const cartOverlay = document.getElementById("cartOverlay");
    const checkoutButton = document.getElementById("checkoutButton");
    const imageModal = document.getElementById("imageModal");
    const imageModalClose = document.getElementById("imageModalClose");

    if (cartButton) cartButton.addEventListener("click", openCart);
    if (closeCartButton) closeCartButton.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
    if (checkoutButton) checkoutButton.addEventListener("click", checkoutCart);
    if (imageModalClose) imageModalClose.addEventListener("click", closeImageModal);

    if (imageModal) {
        imageModal.addEventListener("click", (event) => {
            if (event.target === imageModal) closeImageModal();
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeCart();
            closeImageModal();
        }
    });
}

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
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
    await fetchFirebaseProducts();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
