// =========================================
// MELODEX STORE
// FAST SDK LOADING + REALTIME CACHE + SYNC
// PRODUCT DIRECT LINK + PRODUCT DETAIL
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
    initializeFirestore,
    collection,
    getDocs,
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


// =========================================
// CONSTANTS
// =========================================

const WHATSAPP_NUMBER = "8801310863206";

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

enableIndexedDbPersistence(db).catch(() => {
    // Multiple tabs / unsupported browser fallback
});

let products = [];
let cart = [];

let currentDetailProduct = null;


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

    if (
        cat.includes("cable") ||
        cat.includes("accessori")
    ) {
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
// FETCH PRODUCTS
// =========================================

async function fetchProducts() {

    showProductLoading();

    try {

        const querySnapshot = await getDocs(
            collection(db, "products")
        );

        const fbProducts = [];

        querySnapshot.forEach((doc) => {

            const data = doc.data();

            let imageList = [];

            if (
                Array.isArray(data.images) &&
                data.images.length > 0
            ) {

                imageList = data.images.filter(
                    img =>
                        typeof img === "string" &&
                        img.trim() !== ""
                );

            }

            if (
                imageList.length === 0 &&
                data.image
            ) {

                imageList = [data.image];

            }

            fbProducts.push({

                id: doc.id,

                name:
                    data.name ||
                    "Unnamed Product",

                category:
                    normalizeCategory(data.category),

                price:
                    Number(data.price) || 0,

                image:
                    imageList[0] || "",

                images:
                    imageList,

                description:
                    data.description || ""

            });

        });

        products = fbProducts;

        updateProductCount();

        displayProductsByCategory();

        // Product detail modal তৈরি
        createProductDetailModal();

        // URL-এ product ID থাকলে সরাসরি সেই product খুলবে
        openProductFromUrl();

        console.log(
            `Melodex: ${products.length} products loaded successfully.`
        );

    } catch (error) {

        console.error(
            "Firebase fetch error:",
            error
        );

        showProductLoadError();

    }

}


// =========================================
// PRODUCT COUNT
// =========================================

function updateProductCount() {

    const countElement =
        document.getElementById("total-products-count");

    if (countElement) {

        countElement.textContent =
            products.length > 0
                ? `${products.length}+`
                : "0";

    }

}


// =========================================
// PRODUCT LOADING
// =========================================

function showProductLoading() {

    const categories = [
        "guitars",
        "pedals",
        "pedalboards",
        "stands",
        "cables"
    ];

    categories.forEach(category => {

        const container =
            document.getElementById(
                `${category}Container`
            );

        if (
            container &&
            products.length === 0
        ) {

            container.innerHTML = `

                <div
                    class="product-loading"
                    style="
                        grid-column:1/-1;
                        text-align:center;
                        padding:30px;
                        color:#94a3b8;
                    "
                >

                    <i
                        class="fas fa-spinner fa-spin"
                        style="
                            font-size:24px;
                            color:#ef4444;
                            margin-bottom:8px;
                        "
                    ></i>

                    <p>Loading products...</p>

                </div>

            `;

        }

    });

}


function showProductLoadError() {

    const categories = [
        "guitars",
        "pedals",
        "pedalboards",
        "stands",
        "cables"
    ];

    categories.forEach(category => {

        const container =
            document.getElementById(
                `${category}Container`
            );

        if (
            container &&
            products.length === 0
        ) {

            container.innerHTML = `

                <p
                    style="
                        grid-column:1/-1;
                        text-align:center;
                        color:#ef4444;
                        padding:20px;
                    "
                >
                    প্রোডাক্ট লোড করা সম্ভব হয়নি।
                    অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
                </p>

            `;

        }

    });

}


// =========================================
// DISPLAY PRODUCTS
// =========================================

function displayProductsByCategory() {

    const categories = [
        "guitars",
        "pedals",
        "pedalboards",
        "stands",
        "cables"
    ];

    categories.forEach(category => {

        const container =
            document.getElementById(
                `${category}Container`
            );

        if (!container) return;

        const categoryProducts =
            products.filter(
                p => p.category === category
            );

        if (categoryProducts.length === 0) {

            container.innerHTML = `

                <p
                    class="no-products"
                    style="
                        grid-column:1/-1;
                        text-align:center;
                        color:#64748b;
                        padding:20px;
                    "
                >
                    এই ক্যাটাগরিতে কোনো প্রোডাক্ট নেই।
                </p>

            `;

            return;

        }

        let productsHTML = "";

        categoryProducts.forEach(
            (product, productIndex) => {

                let thumbnailsHTML = "";

                if (
                    product.images &&
                    product.images.length > 1
                ) {

                    thumbnailsHTML =
                        `<div class="product-thumbnails">`;

                    product.images.forEach(
                        (imgUrl, index) => {

                            thumbnailsHTML += `

                                <img
                                    src="${escapeHTML(imgUrl)}"
                                    alt="Product thumbnail"
                                    class="
                                        thumb-img
                                        ${index === 0 ? "active" : ""}
                                    "
                                    data-product-id="${escapeHTML(product.id)}"
                                    data-image="${escapeHTML(imgUrl)}"
                                    loading="lazy"
                                >

                            `;

                        }
                    );

                    thumbnailsHTML += `</div>`;

                }

                const imgLoading =
                    productIndex < 4
                        ? "eager"
                        : "lazy";


                productsHTML += `

                    <div
                        class="product-card"
                        data-product-id="${escapeHTML(product.id)}"
                    >

                        <div class="product-image-wrapper">

                            <img
                                src="${escapeHTML(product.image)}"
                                alt="${escapeHTML(product.name)}"
                                class="product-image"
                                id="main-img-${escapeHTML(product.id)}"
                                loading="${imgLoading}"
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
                                ${escapeHTML(
                                    getCategoryName(
                                        product.category
                                    )
                                )}
                            </span>

                            <h3
                                class="product-name product-detail-link"
                                data-product-id="${escapeHTML(product.id)}"
                                title="View Product Details"
                            >
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

                                    <i class="fas fa-shopping-cart"></i>
                                    Add to Cart

                                </button>

                                <button
                                    class="btn btn-whatsapp"
                                    data-order-product="${escapeHTML(product.id)}"
                                >

                                    <i class="fab fa-whatsapp"></i>
                                    Order Now

                                </button>

                            </div>

                        </div>

                    </div>

                `;

            }
        );

        container.innerHTML = productsHTML;

    });

}


// =========================================
// PRODUCT DETAIL URL
// =========================================

function getProductUrl(productId) {

    const url =
        new URL(
            "index.html",
            window.location.href
        );

    url.search = "";

    url.hash = "";

    url.searchParams.set(
        "product",
        productId
    );

    return url.href;
}


function getProductIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("product");

}


// =========================================
// CREATE PRODUCT DETAIL MODAL
// =========================================

function createProductDetailModal() {

    if (
        document.getElementById(
            "productDetailModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "productDetailModal";

    modal.className =
        "product-detail-modal";


    modal.innerHTML = `

        <div
            class="product-detail-overlay"
            id="productDetailOverlay"
        ></div>

        <div class="product-detail-box">

            <button
                class="product-detail-close"
                id="productDetailClose"
                aria-label="Close Product"
            >
                <i class="fas fa-times"></i>
            </button>


            <div class="product-detail-content">


                <div class="product-detail-gallery">

                    <div class="product-detail-main-image">

                        <img
                            id="detailMainImage"
                            src=""
                            alt="Product"
                        >

                    </div>


                    <div
                        class="product-detail-thumbnails"
                        id="detailThumbnails"
                    ></div>

                </div>


                <div class="product-detail-info">

                    <span
                        class="product-detail-category"
                        id="detailCategory"
                    ></span>


                    <h2
                        id="detailName"
                    ></h2>


                    <div
                        class="product-detail-price"
                        id="detailPrice"
                    ></div>


                    <p
                        class="product-detail-description"
                        id="detailDescription"
                    ></p>


                    <div
                        class="product-detail-actions"
                    >

                        <button
                            class="detail-cart-btn"
                            id="detailAddCart"
                        >

                            <i class="fas fa-shopping-cart"></i>

                            Add to Cart

                        </button>


                        <button
                            class="detail-whatsapp-btn"
                            id="detailOrder"
                        >

                            <i class="fab fa-whatsapp"></i>

                            Order on WhatsApp

                        </button>

                    </div>


                    <div
                        class="product-detail-share"
                    >

                        <span>
                            Product Link
                        </span>


                        <button
                            id="copyProductLink"
                        >

                            <i class="fas fa-copy"></i>

                            Copy Link

                        </button>

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);

    initializeProductDetailEvents();

}


// =========================================
// OPEN PRODUCT DETAIL
// =========================================

function openProductDetail(
    productId,
    updateUrl = true
) {

    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (!product) {

        showNotification(
            "Product not found.",
            "error"
        );

        return;

    }


    currentDetailProduct =
        product;


    const modal =
        document.getElementById(
            "productDetailModal"
        );

    const mainImage =
        document.getElementById(
            "detailMainImage"
        );

    const category =
        document.getElementById(
            "detailCategory"
        );

    const name =
        document.getElementById(
            "detailName"
        );

    const price =
        document.getElementById(
            "detailPrice"
        );

    const description =
        document.getElementById(
            "detailDescription"
        );

    const thumbnails =
        document.getElementById(
            "detailThumbnails"
        );


    if (
        !modal ||
        !mainImage ||
        !category ||
        !name ||
        !price ||
        !description ||
        !thumbnails
    ) {
        return;
    }


    const imageList =
        product.images &&
        product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];


    mainImage.src =
        imageList[0] || "";

    mainImage.alt =
        product.name;


    category.textContent =
        getCategoryName(
            product.category
        );


    name.textContent =
        product.name;


    price.textContent =
        `৳ ${formatPrice(product.price)}`;


    description.textContent =
        product.description ||
        "No product description available.";


    thumbnails.innerHTML = "";


    imageList.forEach(
        (img, index) => {

            const thumb =
                document.createElement("img");

            thumb.src = img;

            thumb.alt =
                `${product.name} image ${index + 1}`;

            thumb.className =
                "detail-thumb" +
                (index === 0
                    ? " active"
                    : "");

            thumb.addEventListener(
                "click",
                () => {

                    mainImage.src =
                        img;

                    thumbnails
                        .querySelectorAll(
                            ".detail-thumb"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    thumb.classList.add(
                        "active"
                    );

                }
            );

            thumbnails.appendChild(
                thumb
            );

        }
    );


    modal.classList.add(
        "active"
    );


    updateBodyScrollLock();


    if (updateUrl) {

        const url =
            new URL(
                window.location.href
            );

        url.searchParams.set(
            "product",
            product.id
        );

        window.history.pushState(
            {
                productId:
                    product.id
            },
            "",
            url.href
        );

    }

}


// =========================================
// CLOSE PRODUCT DETAIL
// =========================================

function closeProductDetail(
    removeUrl = true
) {

    const modal =
        document.getElementById(
            "productDetailModal"
        );

    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    currentDetailProduct =
        null;


    updateBodyScrollLock();


    if (removeUrl) {

        const url =
            new URL(
                window.location.href
            );

        url.searchParams.delete(
            "product"
        );


        window.history.pushState(
            {},
            "",
            url.href
        );

    }

}


// =========================================
// COPY PRODUCT LINK
// =========================================

async function copyCurrentProductLink() {

    if (!currentDetailProduct) {
        return;
    }


    const link =
        getProductUrl(
            currentDetailProduct.id
        );


    try {

        await navigator.clipboard.writeText(
            link
        );

        showNotification(
            "Product link copied!",
            "success"
        );

    } catch (error) {

        // Fallback for older browsers
        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            link;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.focus();

        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

            showNotification(
                "Product link copied!",
                "success"
            );

        } catch {

            showNotification(
                "Copy failed. Please copy the URL manually.",
                "error"
            );

        }


        textarea.remove();

    }

}


// =========================================
// ADD PRODUCT FROM DETAIL
// =========================================

function addDetailProductToCart() {

    if (!currentDetailProduct) {
        return;
    }


    addToCart(
        currentDetailProduct.id
    );

}


// =========================================
// ORDER PRODUCT FROM DETAIL
// =========================================

function orderDetailProduct() {

    if (!currentDetailProduct) {
        return;
    }


    orderSingleProduct(
        currentDetailProduct.id
    );

}


// =========================================
// PRODUCT DETAIL EVENTS
// =========================================

function initializeProductDetailEvents() {

    const closeButton =
        document.getElementById(
            "productDetailClose"
        );

    const overlay =
        document.getElementById(
            "productDetailOverlay"
        );

    const addCart =
        document.getElementById(
            "detailAddCart"
        );

    const orderButton =
        document.getElementById(
            "detailOrder"
        );

    const copyButton =
        document.getElementById(
            "copyProductLink"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () =>
                closeProductDetail(true)
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            () =>
                closeProductDetail(true)
        );

    }


    if (addCart) {

        addCart.addEventListener(
            "click",
            addDetailProductToCart
        );

    }


    if (orderButton) {

        orderButton.addEventListener(
            "click",
            orderDetailProduct
        );

    }


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            copyCurrentProductLink
        );

    }


    window.addEventListener(
        "popstate",
        () => {

            const productId =
                getProductIdFromUrl();


            if (productId) {

                openProductDetail(
                    productId,
                    false
                );

            } else {

                closeProductDetail(
                    false
                );

            }

        }
    );

}


// =========================================
// OPEN PRODUCT FROM URL
// =========================================

function openProductFromUrl() {

    const productId =
        getProductIdFromUrl();


    if (!productId) {
        return;
    }


    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (product) {

        // সামান্য delay যাতে DOM পুরোপুরি ready থাকে
        setTimeout(
            () => {

                openProductDetail(
                    product.id,
                    false
                );

            },
            100
        );

    } else {

        const url =
            new URL(
                window.location.href
            );

        url.searchParams.delete(
            "product"
        );


        window.history.replaceState(
            {},
            "",
            url.href
        );


        showNotification(
            "Product not found.",
            "error"
        );

    }

}


// =========================================
// PRODUCT EVENTS
// =========================================

function initializeProductEvents() {

    document.addEventListener(
        "click",
        event => {

            // Product name -> Detail
            const detailLink =
                event.target.closest(
                    ".product-detail-link"
                );


            if (detailLink) {

                openProductDetail(
                    detailLink.dataset.productId
                );

                return;

            }


            // Add to cart
            const cartBtn =
                event.target.closest(
                    ".btn-add-cart"
                );


            if (cartBtn) {

                addToCart(
                    cartBtn.dataset.productId
                );

                return;

            }


            // Order Now
            const orderBtn =
                event.target.closest(
                    "[data-order-product]"
                );


            if (orderBtn) {

                orderSingleProduct(
                    orderBtn.dataset.orderProduct
                );

                return;

            }


            // Image zoom
            const zoomBtn =
                event.target.closest(
                    ".image-zoom-btn"
                );


            if (zoomBtn) {

                const mainImg =
                    document.getElementById(
                        `main-img-${zoomBtn.dataset.productId}`
                    );


                if (mainImg) {

                    openImageModal(
                        mainImg.src,
                        mainImg.alt
                    );

                }

                return;

            }


            // Product image click
            const prodImg =
                event.target.closest(
                    ".product-image"
                );


            if (prodImg) {

                openImageModal(
                    prodImg.src,
                    prodImg.alt
                );

                return;

            }


            // Product thumbnails
            const thumb =
                event.target.closest(
                    ".thumb-img"
                );


            if (thumb) {

                const productId =
                    thumb.dataset.productId;

                const imgURL =
                    thumb.dataset.image;


                const mainImg =
                    document.getElementById(
                        `main-img-${productId}`
                    );


                if (mainImg) {

                    mainImg.src =
                        imgURL;

                }


                const parent =
                    thumb.parentElement;


                if (parent) {

                    parent
                        .querySelectorAll(
                            ".thumb-img"
                        )
                        .forEach(
                            t =>
                                t.classList.remove(
                                    "active"
                                )
                        );


                    thumb.classList.add(
                        "active"
                    );

                }

            }

        }
    );

}


// =========================================
// CART
// =========================================

function loadCart() {

    try {

        const saved =
            localStorage.getItem(
                "melodexCart"
            );


        cart =
            saved
                ? JSON.parse(saved)
                : [];


        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch {

        cart = [];

    }

}


function saveCart() {

    try {

        localStorage.setItem(
            "melodexCart",
            JSON.stringify(cart)
        );

    } catch (e) {

        console.warn(
            "Cart save failed:",
            e
        );

    }

}


function addToCart(productId) {

    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const existing =
        cart.find(
            i =>
                String(i.id) ===
                String(productId)
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                product.price,

            image:
                product.image,

            category:
                product.category,

            quantity:
                1

        });

    }


    saveCart();

    updateCart();


    showNotification(
        `${product.name} added to cart!`,
        "success"
    );

}


function updateCart() {

    updateCartCount();

    renderCart();

}


function updateCartCount() {

    const cartCount =
        document.querySelector(
            ".cart-count"
        );


    if (!cartCount) {
        return;
    }


    const totalQuantity =
        cart.reduce(
            (tot, item) =>
                tot +
                Number(
                    item.quantity || 0
                ),
            0
        );


    cartCount.textContent =
        totalQuantity;

}


function renderCart() {

    const cartItems =
        document.getElementById(
            "cartItems"
        );

    const cartEmpty =
        document.getElementById(
            "cartEmpty"
        );

    const cartFooter =
        document.getElementById(
            "cartFooter"
        );

    const cartTotal =
        document.getElementById(
            "cartTotal"
        );


    if (
        !cartItems ||
        !cartEmpty ||
        !cartFooter ||
        !cartTotal
    ) {
        return;
    }


    if (cart.length === 0) {

        cartItems.innerHTML =
            "";

        cartEmpty.style.display =
            "flex";

        cartFooter.style.display =
            "none";

        cartTotal.textContent =
            "৳ 0";

        return;

    }


    cartEmpty.style.display =
        "none";

    cartFooter.style.display =
        "block";


    let cartHTML = "";

    let totalPrice = 0;


    cart.forEach(item => {

        const itemTotal =
            Number(item.price) *
            Number(item.quantity);


        totalPrice +=
            itemTotal;


        cartHTML += `

            <div class="cart-item">

                <img
                    src="${escapeHTML(item.image)}"
                    alt="${escapeHTML(item.name)}"
                    class="cart-item-image"
                    loading="lazy"
                >


                <div class="cart-item-info">

                    <h4>
                        ${escapeHTML(item.name)}
                    </h4>


                    <span class="cart-item-price">
                        ৳ ${formatPrice(item.price)}
                    </span>


                    <div class="cart-quantity">

                        <button
                            class="quantity-btn"
                            data-cart-action="decrease"
                            data-product-id="${escapeHTML(item.id)}"
                        >

                            <i class="fas fa-minus"></i>

                        </button>


                        <span>
                            ${item.quantity}
                        </span>


                        <button
                            class="quantity-btn"
                            data-cart-action="increase"
                            data-product-id="${escapeHTML(item.id)}"
                        >

                            <i class="fas fa-plus"></i>

                        </button>

                    </div>


                    <span class="cart-item-subtotal">
                        ৳ ${formatPrice(itemTotal)}
                    </span>

                </div>


                <button
                    class="remove-cart-item"
                    data-product-id="${escapeHTML(item.id)}"
                    aria-label="Remove Product"
                >

                    <i class="fas fa-trash"></i>

                </button>

            </div>

        `;

    });


    cartItems.innerHTML =
        cartHTML;


    cartTotal.textContent =
        `৳ ${formatPrice(totalPrice)}`;

}


function initializeCartEvents() {

    document.addEventListener(
        "click",
        event => {

            const qBtn =
                event.target.closest(
                    "[data-cart-action]"
                );


            if (qBtn) {

                changeCartQuantity(
                    qBtn.dataset.productId,
                    qBtn.dataset.cartAction
                );

                return;

            }


            const rmBtn =
                event.target.closest(
                    ".remove-cart-item"
                );


            if (rmBtn) {

                removeCartItem(
                    rmBtn.dataset.productId
                );

            }

        }
    );

}


function changeCartQuantity(
    productId,
    action
) {

    const item =
        cart.find(
            i =>
                String(i.id) ===
                String(productId)
        );


    if (!item) {
        return;
    }


    if (
        action ===
        "increase"
    ) {

        item.quantity += 1;

    }


    if (
        action ===
        "decrease"
    ) {

        item.quantity -= 1;


        if (item.quantity <= 0) {

            cart =
                cart.filter(
                    i =>
                        String(i.id) !==
                        String(productId)
                );

        }

    }


    saveCart();

    updateCart();

}


function removeCartItem(productId) {

    cart =
        cart.filter(
            i =>
                String(i.id) !==
                String(productId)
        );


    saveCart();

    updateCart();


    showNotification(
        "Product removed from cart.",
        "success"
    );

}


// =========================================
// CART OPEN / CLOSE
// =========================================

function openCart() {

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (
        sidebar &&
        overlay
    ) {

        sidebar.classList.add(
            "active"
        );

        overlay.classList.add(
            "active"
        );

        updateBodyScrollLock();

    }

}


function closeCart() {

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }


    updateBodyScrollLock();

}


// =========================================
// WHATSAPP ORDER
// =========================================

function orderSingleProduct(productId) {

    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const msg =
        `Hello Melodex! 👋

I want to order:

Product: ${product.name}
Price: ৳ ${formatPrice(product.price)}

Please let me know about availability and delivery.`;


    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;


    window.open(
        whatsappURL,
        "_blank"
    );

}


function checkoutCart() {

    if (cart.length === 0) {

        showNotification(
            "Your cart is empty.",
            "error"
        );

        return;

    }


    let msg =
        "Hello Melodex! 👋\n\n" +
        "I want to order these products:\n\n";


    let total = 0;


    cart.forEach(
        (item, index) => {

            const sub =
                Number(item.price) *
                Number(item.quantity);


            total += sub;


            msg +=
                `${index + 1}. ${item.name}\n` +
                `Quantity: ${item.quantity}\n` +
                `Price: ৳ ${formatPrice(item.price)}\n` +
                `Subtotal: ৳ ${formatPrice(sub)}\n\n`;

        }
    );


    msg +=
        `Total Amount: ৳ ${formatPrice(total)}\n\n` +
        "Please confirm availability and delivery details.";


    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;


    window.open(
        whatsappURL,
        "_blank"
    );

}


// =========================================
// IMAGE MODAL
// =========================================

function openImageModal(
    imgURL,
    altText
) {

    const modal =
        document.getElementById(
            "imageModal"
        );

    const modalImg =
        document.getElementById(
            "modalImage"
        );


    if (
        !modal ||
        !modalImg
    ) {
        return;
    }


    modalImg.src =
        imgURL;


    modalImg.alt =
        altText ||
        "Product Image";


    modal.classList.add(
        "active"
    );


    updateBodyScrollLock();

}


function closeImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    updateBodyScrollLock();

}


// =========================================
// BODY SCROLL LOCK
// =========================================

function updateBodyScrollLock() {

    const imageModal =
        document.getElementById(
            "imageModal"
        );

    const cartSidebar =
        document.getElementById(
            "cartSidebar"
        );

    const productModal =
        document.getElementById(
            "productDetailModal"
        );


    const locked =
        (
            imageModal &&
            imageModal.classList.contains(
                "active"
            )
        ) ||
        (
            cartSidebar &&
            cartSidebar.classList.contains(
                "active"
            )
        ) ||
        (
            productModal &&
            productModal.classList.contains(
                "active"
            )
        );


    document.body.style.overflow =
        locked
            ? "hidden"
            : "";

}


// =========================================
// NOTIFICATION
// =========================================

function showNotification(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "notificationContainer"
        );


    if (!container) {
        return;
    }


    const note =
        document.createElement(
            "div"
        );


    note.className =
        `notification ${type}`;


    note.textContent =
        message;


    container.appendChild(
        note
    );


    setTimeout(
        () => {

            note.classList.add(
                "hide"
            );


            setTimeout(
                () =>
                    note.remove(),
                300
            );

        },
        2500
    );

}


// =========================================
// UTILITIES
// =========================================

function formatPrice(price) {

    return Number(
        price || 0
    ).toLocaleString(
        "en-BD"
    );

}


function escapeHTML(str) {

    if (
        str === null ||
        str === undefined
    ) {
        return "";
    }


    return String(str)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================
// GENERAL EVENTS
// =========================================

function initializeEvents() {

    const cartButton =
        document.getElementById(
            "cartButton"
        );

    const closeCartButton =
        document.getElementById(
            "closeCart"
        );

    const cartOverlay =
        document.getElementById(
            "cartOverlay"
        );

    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );

    const imageModalClose =
        document.getElementById(
            "imageModalClose"
        );

    const imageModal =
        document.getElementById(
            "imageModal"
        );


    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            checkoutCart
        );

    }


    if (imageModalClose) {

        imageModalClose.addEventListener(
            "click",
            closeImageModal
        );

    }


    if (imageModal) {

        imageModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    imageModal
                ) {

                    closeImageModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeCart();

                closeImageModal();

                closeProductDetail(
                    true
                );

            }

        }
    );


    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    function (event) {

                        const href =
                            this.getAttribute(
                                "href"
                            );


                        if (
                            !href ||
                            href === "#"
                        ) {
                            return;
                        }


                        const target =
                            document.querySelector(
                                href
                            );


                        if (target) {

                            event.preventDefault();


                            target.scrollIntoView(
                                {
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                }
                            );

                        }

                    }
                );

            }
        );

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

    // Modal আগে তৈরি করে রাখি
    createProductDetailModal();

    fetchProducts();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

} else {

    initApp();

}
