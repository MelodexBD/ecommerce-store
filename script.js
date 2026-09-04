/* =========================================================
   MELODEX STOREFRONT
   Firebase + Products + Cart + WhatsApp Orders
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ",
    authDomain: "melodex-store.firebaseapp.com",
    projectId: "melodex-store",
    storageBucket: "melodex-store.firebasestorage.app",
    messagingSenderId: "563447283369",
    appId: "1:563447283369:web:a999e89adf7380ec4733b8",
    measurementId: "G-G133358KKB"
};


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================================
   OPTIONAL FIRESTORE OFFLINE CACHE
   ========================================================= */

enableIndexedDbPersistence(db).catch((error) => {

    if (error.code === "failed-precondition") {
        console.warn(
            "Firestore offline persistence disabled because another tab is using it."
        );
    }

    if (error.code === "unimplemented") {
        console.warn(
            "Firestore offline persistence is not supported in this browser."
        );
    }

});


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let products = [];
let cart = [];

const CART_STORAGE_KEY = "melodexCart";

const WHATSAPP_NUMBER = "8801310863206";


/* =========================================================
   CATEGORY CONFIGURATION
   ========================================================= */

const CATEGORY_CONFIG = {

    guitars: {
        containerId: "guitarsContainer",
        sectionId: "guitars"
    },

    pedals: {
        containerId: "pedalsContainer",
        sectionId: "pedals"
    },

    pedalboards: {
        containerId: "pedalboardsContainer",
        sectionId: "pedalboards"
    },

    stands: {
        containerId: "standsContainer",
        sectionId: "stands"
    },

    cables: {
        containerId: "cablesContainer",
        sectionId: "cables"
    }

};


/* =========================================================
   PLACEHOLDER IMAGE
   ========================================================= */

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="800"
             height="800"
             viewBox="0 0 800 800">

            <rect width="800" height="800" fill="#111111"/>

            <text
                x="400"
                y="380"
                text-anchor="middle"
                fill="#ffffff"
                font-size="55"
                font-family="Arial">
                MELODEX
            </text>

            <text
                x="400"
                y="445"
                text-anchor="middle"
                fill="#aaaaaa"
                font-size="26"
                font-family="Arial">
                No Image
            </text>

        </svg>
    `);


/* =========================================================
   DOM READY
   ========================================================= */

function startApp() {

    loadCart();

    setupNavigation();

    setupCartEvents();

    setupProductEvents();

    setupImageModal();

    fetchProducts();

}


/* =========================================================
   START APPLICATION
   ========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        startApp
    );

} else {

    startApp();

}


/* =========================================================
   CATEGORY NORMALIZATION
   ========================================================= */

function normalizeCategory(category) {

    const value =
        String(category || "")
            .trim()
            .toLowerCase();

    if (
        value === "guitar" ||
        value === "guitars"
    ) {
        return "guitars";
    }


    if (
        value === "pedal" ||
        value === "pedals" ||
        value === "effects" ||
        value === "effect"
    ) {
        return "pedals";
    }


    if (
        value === "pedalboard" ||
        value === "pedalboards"
    ) {
        return "pedalboards";
    }


    if (
        value === "stand" ||
        value === "stands"
    ) {
        return "stands";
    }


    if (
        value === "cables" ||
        value === "cable" ||
        value === "accessories" ||
        value === "cables & accessories" ||
        value === "cables and accessories"
    ) {
        return "cables";
    }


    return value;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   SAFE NUMBER
   ========================================================= */

function safeNumber(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;

}


/* =========================================================
   FORMAT PRICE
   ========================================================= */

function formatPrice(value) {

    const price = safeNumber(value);

    return (
        "৳ " +
        price.toLocaleString("en-BD")
    );

}


/* =========================================================
   GET PRODUCT IMAGES
   ========================================================= */

function getProductImages(product) {

    let images = [];

    if (Array.isArray(product.images)) {

        images = product.images
            .filter(Boolean)
            .map(image => String(image).trim())
            .filter(Boolean);

    }


    if (
        images.length === 0 &&
        product.image
    ) {

        images = [
            String(product.image).trim()
        ];

    }


    if (images.length === 0) {

        images = [
            PLACEHOLDER_IMAGE
        ];

    }


    return [
        ...new Set(images)
    ].slice(0, 4);

}


/* =========================================================
   FETCH PRODUCTS FROM FIRESTORE
   ========================================================= */

async function fetchProducts() {

    showProductsLoading();

    try {

        const snapshot =
            await getDocs(
                collection(db, "products")
            );


        const fbProducts = [];


        snapshot.forEach((doc) => {

            const data = doc.data() || {};

            const product = {

                id: doc.id,

                name:
                    data.name ||
                    "Unnamed Product",

                category:
                    normalizeCategory(
                        data.category
                    ),

                price:
                    safeNumber(
                        data.price
                    ),

                description:
                    data.description ||
                    "",

                image:
                    data.image ||
                    "",

                images:
                    Array.isArray(data.images)
                        ? data.images
                        : []

            };


            product.images =
                getProductImages(product);


            if (
                !product.image &&
                product.images.length > 0
            ) {
                product.image =
                    product.images[0];
            }


            fbProducts.push(product);

        });


        /*
         * Sort products by name
         */
        fbProducts.sort(
            (a, b) =>
                String(a.name)
                    .localeCompare(
                        String(b.name)
                    )
        );


        products = fbProducts;


        updateProductCount();

        displayProductsByCategory();

        /*
         * If URL contains ?product=PRODUCT_ID
         * automatically open that product.
         */
        openProductFromURL();


    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

        showProductsError();

        showNotification(
            "Products could not be loaded. Please try again.",
            "error"
        );

    }

}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showProductsLoading() {

    Object.values(CATEGORY_CONFIG)
        .forEach(config => {

            const container =
                document.getElementById(
                    config.containerId
                );

            if (!container) return;

            container.innerHTML = `
                <div class="products-loading"
                     style="
                        width:100%;
                        padding:40px 20px;
                        text-align:center;
                        grid-column:1/-1;
                        opacity:.7;
                     ">

                    <i
                        class="fas fa-spinner fa-spin"
                        style="font-size:30px;"
                    ></i>

                    <p style="margin-top:15px;">
                        Loading products...
                    </p>

                </div>
            `;

        });

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showProductsError() {

    Object.values(CATEGORY_CONFIG)
        .forEach(config => {

            const container =
                document.getElementById(
                    config.containerId
                );

            if (!container) return;

            container.innerHTML = `
                <div
                    style="
                        width:100%;
                        padding:40px 20px;
                        text-align:center;
                        grid-column:1/-1;
                    "
                >

                    <i
                        class="fas fa-triangle-exclamation"
                        style="
                            font-size:35px;
                            margin-bottom:15px;
                        "
                    ></i>

                    <h3>
                        Unable to load products
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>
            `;

        });

}


/* =========================================================
   UPDATE PRODUCT COUNT
   ========================================================= */

function updateProductCount() {

    const countElement =
        document.getElementById(
            "total-products-count"
        );

    if (!countElement) return;

    countElement.textContent =
        products.length;

}


/* =========================================================
   DISPLAY PRODUCTS
   ========================================================= */

function displayProductsByCategory() {

    Object.values(CATEGORY_CONFIG)
        .forEach(config => {

            const container =
                document.getElementById(
                    config.containerId
                );

            if (!container) return;

            container.innerHTML = "";

        });


    Object.keys(CATEGORY_CONFIG)
        .forEach(category => {

            const config =
                CATEGORY_CONFIG[category];

            const container =
                document.getElementById(
                    config.containerId
                );

            if (!container) return;


            const categoryProducts =
                products.filter(
                    product =>
                        normalizeCategory(
                            product.category
                        ) === category
                );


            if (
                categoryProducts.length === 0
            ) {

                container.innerHTML = `
                    <div
                        class="category-empty"
                        style="
                            width:100%;
                            padding:35px 20px;
                            text-align:center;
                            grid-column:1/-1;
                            opacity:.65;
                        "
                    >

                        <i
                            class="fas fa-box-open"
                            style="
                                font-size:30px;
                                margin-bottom:12px;
                            "
                        ></i>

                        <h3>
                            No products available
                        </h3>

                        <p>
                            Products will appear here soon.
                        </p>

                    </div>
                `;

                return;

            }


            categoryProducts.forEach(
                product => {

                    container.insertAdjacentHTML(
                        "beforeend",
                        renderProductCard(product)
                    );

                }
            );

        });

}


/* =========================================================
   RENDER PRODUCT CARD
   ========================================================= */

function renderProductCard(product) {

    const productId =
        String(product.id);

    const safeProductId =
        escapeHTML(productId);

    const productName =
        escapeHTML(
            product.name
        );

    const description =
        escapeHTML(
            product.description
        );

    const price =
        formatPrice(
            product.price
        );


    const images =
        getProductImages(product);


    const firstImage =
        escapeHTML(
            images[0]
        );


    let thumbnailsHTML = "";


    if (images.length > 1) {

        thumbnailsHTML = `
            <div class="product-thumbnails">

                ${images.map(
                    (image, index) => `

                    <button
                        type="button"
                        class="product-thumbnail ${index === 0 ? "active" : ""}"
                        data-product-id="${safeProductId}"
                        data-image-index="${index}"
                        aria-label="View image ${index + 1}"
                    >
                        <img
                            src="${escapeHTML(image)}"
                            alt="${productName}"
                            loading="lazy"
                            onerror="this.src='${escapeHTML(PLACEHOLDER_IMAGE)}'"
                        >
                    </button>

                `
                ).join("")}

            </div>
        `;

    }


    return `

        <article
            class="product-card"
            id="product-${safeProductId}"
            data-product-id="${safeProductId}"
        >

            <div
                class="product-image-wrapper"
                style="
                    position:relative;
                    aspect-ratio:1 / 1;
                    overflow:hidden;
                "
            >

                <img
                    class="product-image product-main-image"
                    src="${firstImage}"
                    alt="${productName}"
                    loading="lazy"
                    data-product-id="${safeProductId}"
                    data-image-index="0"
                    onerror="this.src='${escapeHTML(PLACEHOLDER_IMAGE)}'"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        cursor:pointer;
                    "
                >


                <button
                    type="button"
                    class="zoom-btn zoom-product-btn"
                    data-product-id="${safeProductId}"
                    aria-label="Zoom product image"
                    title="View Image"
                >
                    <i class="fas fa-search-plus"></i>
                </button>

            </div>


            ${thumbnailsHTML}


            <div class="product-info">

                <h3 class="product-name">
                    ${productName}
                </h3>


                ${
                    description
                        ? `
                            <p class="product-description">
                                ${description}
                            </p>
                        `
                        : ""
                }


                <div class="product-bottom">

                    <div class="product-price">
                        ${price}
                    </div>

                </div>


                <div
                    class="product-actions"
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        class="add-to-cart-btn"
                        data-product-id="${safeProductId}"
                    >
                        <i class="fas fa-cart-plus"></i>
                        Add to Cart
                    </button>


                    <button
                        type="button"
                        class="order-now-btn"
                        data-product-id="${safeProductId}"
                    >
                        <i class="fab fa-whatsapp"></i>
                        Order Now
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   PRODUCT EVENT DELEGATION
   ========================================================= */

function setupProductEvents() {

    document.addEventListener(
        "click",
        function (event) {


            /*
             * ADD TO CART
             */

            const addButton =
                event.target.closest(
                    ".add-to-cart-btn"
                );

            if (addButton) {

                const productId =
                    addButton.dataset.productId;

                addToCart(productId);

                return;

            }


            /*
             * ORDER NOW
             */

            const orderButton =
                event.target.closest(
                    ".order-now-btn"
                );

            if (orderButton) {

                const productId =
                    orderButton.dataset.productId;

                orderProductNow(productId);

                return;

            }


            /*
             * ZOOM BUTTON
             */

            const zoomButton =
                event.target.closest(
                    ".zoom-product-btn"
                );

            if (zoomButton) {

                const productId =
                    zoomButton.dataset.productId;

                const product =
                    findProduct(productId);

                if (!product) return;

                openImageModal(
                    getProductImages(product)[0]
                );

                return;

            }


            /*
             * MAIN PRODUCT IMAGE
             */

            const mainImage =
                event.target.closest(
                    ".product-main-image"
                );

            if (
                mainImage &&
                !event.target.closest(
                    ".zoom-product-btn"
                )
            ) {

                const productId =
                    mainImage.dataset.productId;

                const imageIndex =
                    Number(
                        mainImage.dataset.imageIndex || 0
                    );

                const product =
                    findProduct(productId);

                if (!product) return;

                const images =
                    getProductImages(product);

                openImageModal(
                    images[imageIndex] ||
                    images[0]
                );

                return;

            }


            /*
             * THUMBNAIL
             */

            const thumbnail =
                event.target.closest(
                    ".product-thumbnail"
                );

            if (thumbnail) {

                event.preventDefault();

                const productId =
                    thumbnail.dataset.productId;

                const imageIndex =
                    Number(
                        thumbnail.dataset.imageIndex || 0
                    );

                changeProductImage(
                    productId,
                    imageIndex
                );

                return;

            }

        }
    );

}


/* =========================================================
   FIND PRODUCT
   ========================================================= */

function findProduct(productId) {

    return products.find(
        product =>
            String(product.id) ===
            String(productId)
    );

}


/* =========================================================
   CHANGE PRODUCT IMAGE
   ========================================================= */

function changeProductImage(
    productId,
    imageIndex
) {

    const product =
        findProduct(productId);

    if (!product) return;


    const images =
        getProductImages(product);


    const selectedImage =
        images[imageIndex];

    if (!selectedImage) return;


    const card =
        document.querySelector(
            `.product-card[data-product-id="${CSS.escape(String(productId))}"]`
        );

    if (!card) return;


    const mainImage =
        card.querySelector(
            ".product-main-image"
        );

    if (!mainImage) return;


    mainImage.src =
        selectedImage;

    mainImage.dataset.imageIndex =
        String(imageIndex);


    const thumbnails =
        card.querySelectorAll(
            ".product-thumbnail"
        );


    thumbnails.forEach(
        (thumb, index) => {

            thumb.classList.toggle(
                "active",
                index === imageIndex
            );

        }
    );

}


/* =========================================================
   IMAGE MODAL
   ========================================================= */

function setupImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );

    const closeButton =
        document.getElementById(
            "imageModalClose"
        );


    if (!modal) return;


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeImageModal
        );

    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {
                closeImageModal();
            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {
                closeImageModal();
            }

        }
    );

}


/* =========================================================
   OPEN IMAGE MODAL
   ========================================================= */

function openImageModal(imageURL) {

    const modal =
        document.getElementById(
            "imageModal"
        );

    const image =
        document.getElementById(
            "modalImage"
        );


    if (!modal || !image) return;


    image.src =
        imageURL ||
        PLACEHOLDER_IMAGE;


    modal.classList.add("active");

    modal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE IMAGE MODAL
   ========================================================= */

function closeImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );

    const image =
        document.getElementById(
            "modalImage"
        );


    if (!modal) return;


    modal.classList.remove("active");

    modal.style.display =
        "";


    document.body.style.overflow =
        "";


    if (image) {
        image.src = "";
    }

}


/* =========================================================
   LOAD CART
   ========================================================= */

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        if (!savedCart) {

            cart = [];

            updateCartUI();

            return;

        }


        const parsed =
            JSON.parse(savedCart);


        if (Array.isArray(parsed)) {

            cart =
                parsed
                    .filter(
                        item =>
                            item &&
                            item.id
                    )
                    .map(
                        item => ({

                            id:
                                String(
                                    item.id
                                ),

                            name:
                                item.name ||
                                "Product",

                            price:
                                safeNumber(
                                    item.price
                                ),

                            image:
                                item.image ||
                                PLACEHOLDER_IMAGE,

                            quantity:
                                Math.max(
                                    1,
                                    Number(
                                        item.quantity
                                    ) || 1
                                )

                        })
                    );

        } else {

            cart = [];

        }

    } catch (error) {

        console.error(
            "Cart load error:",
            error
        );

        cart = [];

    }


    updateCartUI();

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );

    } catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(productId) {

    const product =
        findProduct(productId);


    if (!product) {

        showNotification(
            "Product not found.",
            "error"
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existing) {

        existing.quantity += 1;

        showNotification(
            `${product.name} quantity updated.`,
            "success"
        );

    } else {

        const images =
            getProductImages(product);


        cart.push({

            id:
                String(product.id),

            name:
                product.name,

            price:
                safeNumber(
                    product.price
                ),

            image:
                images[0],

            quantity: 1

        });


        showNotification(
            `${product.name} added to cart.`,
            "success"
        );

    }


    saveCart();

    updateCartUI();

}


/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCart();

    updateCartUI();


    showNotification(
        "Product removed from cart.",
        "success"
    );

}


/* =========================================================
   CHANGE CART QUANTITY
   ========================================================= */

function changeCartQuantity(
    productId,
    change
) {

    const item =
        cart.find(
            cartItem =>
                String(cartItem.id) ===
                String(productId)
        );


    if (!item) return;


    item.quantity += Number(change);


    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;

    }


    saveCart();

    updateCartUI();

}


/* =========================================================
   CART EVENT SETUP
   ========================================================= */

function setupCartEvents() {

    const cartButton =
        document.getElementById(
            "cartButton"
        );

    const closeCart =
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


    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    if (closeCart) {

        closeCart.addEventListener(
            "click",
            closeCartSidebar
        );

    }


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCartSidebar
        );

    }


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            checkoutCart
        );

    }


    document.addEventListener(
        "click",
        function (event) {


            const plusButton =
                event.target.closest(
                    ".cart-plus"
                );


            if (plusButton) {

                changeCartQuantity(
                    plusButton.dataset.productId,
                    1
                );

                return;

            }


            const minusButton =
                event.target.closest(
                    ".cart-minus"
                );


            if (minusButton) {

                changeCartQuantity(
                    minusButton.dataset.productId,
                    -1
                );

                return;

            }


            const removeButton =
                event.target.closest(
                    ".cart-remove"
                );


            if (removeButton) {

                removeFromCart(
                    removeButton.dataset.productId
                );

                return;

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeCartSidebar();

            }

        }
    );

}


/* =========================================================
   UPDATE CART UI
   ========================================================= */

function updateCartUI() {

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


    const cartCounts =
        document.querySelectorAll(
            ".cart-count"
        );


    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total +
                safeNumber(
                    item.quantity
                ),
            0
        );


    cartCounts.forEach(
        element => {

            element.textContent =
                totalQuantity;

        }
    );


    if (!cartItems) return;


    if (cart.length === 0) {

        cartItems.innerHTML = "";


        if (cartEmpty) {

            cartEmpty.style.display =
                "flex";

        }


        if (cartFooter) {

            cartFooter.style.display =
                "none";

        }


        if (cartTotal) {

            cartTotal.textContent =
                "৳ 0";

        }


        return;

    }


    if (cartEmpty) {

        cartEmpty.style.display =
            "none";

    }


    if (cartFooter) {

        cartFooter.style.display =
            "block";

    }


    let total =
        0;


    cartItems.innerHTML =
        cart.map(
            item => {

                const quantity =
                    Math.max(
                        1,
                        safeNumber(
                            item.quantity
                        )
                    );


                const itemPrice =
                    safeNumber(
                        item.price
                    );


                const itemTotal =
                    itemPrice *
                    quantity;


                total +=
                    itemTotal;


                return `

                    <div
                        class="cart-item"
                        data-product-id="${escapeHTML(item.id)}"
                    >

                        <div class="cart-item-image">

                            <img
                                src="${escapeHTML(item.image || PLACEHOLDER_IMAGE)}"
                                alt="${escapeHTML(item.name)}"
                                onerror="this.src='${escapeHTML(PLACEHOLDER_IMAGE)}'"
                            >

                        </div>


                        <div class="cart-item-info">

                            <h4>
                                ${escapeHTML(item.name)}
                            </h4>

                            <div class="cart-item-price">
                                ${formatPrice(itemPrice)}
                            </div>


                            <div class="cart-item-controls">

                                <button
                                    type="button"
                                    class="cart-minus"
                                    data-product-id="${escapeHTML(item.id)}"
                                    aria-label="Decrease quantity"
                                >
                                    <i class="fas fa-minus"></i>
                                </button>


                                <span>
                                    ${quantity}
                                </span>


                                <button
                                    type="button"
                                    class="cart-plus"
                                    data-product-id="${escapeHTML(item.id)}"
                                    aria-label="Increase quantity"
                                >
                                    <i class="fas fa-plus"></i>
                                </button>


                                <button
                                    type="button"
                                    class="cart-remove"
                                    data-product-id="${escapeHTML(item.id)}"
                                    aria-label="Remove product"
                                    title="Remove"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>

                            </div>


                            <div class="cart-item-total">

                                ${formatPrice(itemTotal)}

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");


    if (cartTotal) {

        cartTotal.textContent =
            formatPrice(total);

    }

}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );


    if (overlay) {

        overlay.classList.add(
            "active"
        );

        overlay.style.display =
            "block";

    }


    if (sidebar) {

        sidebar.classList.add(
            "active"
        );

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE CART
   ========================================================= */

function closeCartSidebar() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

        overlay.style.display =
            "";

    }


    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   ORDER SINGLE PRODUCT
   ========================================================= */

function orderProductNow(productId) {

    const product =
        findProduct(productId);


    if (!product) {

        showNotification(
            "Product not found.",
            "error"
        );

        return;

    }


    const websiteURL =
        getWebsiteURL();


    const productURL =
        `${websiteURL}/?product=${encodeURIComponent(product.id)}`;


    const message =

        `🎵 *MELODEX ORDER REQUEST*\n\n` +

        `📦 Product: ${product.name}\n` +

        `💰 Price: ${formatPrice(product.price)}\n` +

        `🔢 Quantity: 1\n\n` +

        `🔗 Product Link:\n${productURL}\n\n` +

        `I want to order this product. Please provide further details.`;


    openWhatsApp(
        message
    );

}


/* =========================================================
   CHECKOUT CART
   ========================================================= */

function checkoutCart() {

    if (
        !Array.isArray(cart) ||
        cart.length === 0
    ) {

        showNotification(
            "Your cart is empty.",
            "error"
        );

        return;

    }


    let total =
        0;


    let message =
        `🎵 *MELODEX ORDER REQUEST*\n\n`;


    message +=
        `🛒 *Products:*\n\n`;


    cart.forEach(
        (item, index) => {

            const quantity =
                Math.max(
                    1,
                    safeNumber(
                        item.quantity
                    )
                );


            const price =
                safeNumber(
                    item.price
                );


            const itemTotal =
                price *
                quantity;


            total +=
                itemTotal;


            message +=
                `${index + 1}. ${item.name}\n` +

                `   Price: ${formatPrice(price)}\n` +

                `   Quantity: ${quantity}\n` +

                `   Subtotal: ${formatPrice(itemTotal)}\n\n`;

        }
    );


    message +=
        `━━━━━━━━━━━━━━\n`;

    message +=
        `💰 *TOTAL: ${formatPrice(total)}*\n\n`;

    message +=
        `Please confirm my order and provide delivery/payment details.`;


    openWhatsApp(
        message
    );

}


/* =========================================================
   OPEN WHATSAPP
   ========================================================= */

function openWhatsApp(message) {

    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(message);


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   WEBSITE URL
   ========================================================= */

function getWebsiteURL() {

    const currentURL =
        window.location.href;


    /*
     * Remove admin.html
     */

    let websiteURL =
        currentURL.replace(
            /admin\.html.*$/i,
            ""
        );


    /*
     * Remove query/hash
     */

    websiteURL =
        websiteURL.split("?")[0];

    websiteURL =
        websiteURL.split("#")[0];


    /*
     * Remove trailing slash
     */

    websiteURL =
        websiteURL.replace(
            /\/$/,
            ""
        );


    return websiteURL;

}


/* =========================================================
   OPEN PRODUCT FROM URL
   =========================================================

   Example:

   https://yourwebsite.com/?product=PRODUCT_ID

   ========================================================= */

function openProductFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const productId =
        params.get("product");


    if (!productId) {
        return;
    }


    const product =
        products.find(
            p =>
                String(p.id) ===
                String(productId)
        );


    if (!product) {

        console.warn(
            "Product not found:",
            productId
        );

        return;

    }


    setTimeout(
        () => {

            const productElement =
                document.getElementById(
                    `product-${productId}`
                );


            if (!productElement) {

                console.warn(
                    "Product element not found:",
                    productId
                );

                return;

            }


            productElement.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });


            const originalBoxShadow =
                productElement.style.boxShadow;


            const originalTransform =
                productElement.style.transform;


            const originalTransition =
                productElement.style.transition;


            productElement.style.transition =
                "all 0.4s ease";


            productElement.style.boxShadow =
                "0 0 0 3px #ef4444, 0 0 35px rgba(239,68,68,0.5)";


            productElement.style.transform =
                "scale(1.02)";


            setTimeout(
                () => {

                    productElement.style.boxShadow =
                        originalBoxShadow;


                    productElement.style.transform =
                        originalTransform;


                    productElement.style.transition =
                        originalTransition;

                },
                3000
            );


        },
        500
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest(
                    'a[href^="#"]'
                );


            if (!link) return;


            const href =
                link.getAttribute(
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


            if (!target) return;


            event.preventDefault();


            target.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });


        }
    );

}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "notificationContainer"
        );


    if (!container) {

        alert(message);

        return;

    }


    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        `melodex-notification ${type}`;


    notification.innerHTML = `

        <div class="notification-icon">

            <i class="${
                type === "error"
                    ? "fas fa-circle-exclamation"
                    : "fas fa-check-circle"
            }"></i>

        </div>

        <div class="notification-message">

            ${escapeHTML(message)}

        </div>

    `;


    /*
     * Inline fallback styling.
     * Existing CSS can override it.
     */

    notification.style.cssText = `

        position:fixed;
        right:20px;
        bottom:20px;
        z-index:99999;

        display:flex;
        align-items:center;
        gap:12px;

        max-width:380px;

        padding:14px 18px;

        border-radius:10px;

        background:#111;

        color:#fff;

        box-shadow:
            0 10px 30px rgba(0,0,0,.3);

        border:
            1px solid rgba(255,255,255,.12);

        animation:
            melodexNotificationIn .3s ease;

    `;


    container.appendChild(
        notification
    );


    setTimeout(
        () => {

            notification.style.opacity =
                "0";

            notification.style.transform =
                "translateY(10px)";


            notification.style.transition =
                "all .3s ease";


            setTimeout(
                () => {

                    notification.remove();

                },
                300
            );

        },
        3000
    );

}


/* =========================================================
   NOTIFICATION ANIMATION
   ========================================================= */

const notificationStyle =
    document.createElement(
        "style"
    );


notificationStyle.textContent = `

    @keyframes melodexNotificationIn {

        from {

            opacity:0;

            transform:
                translateY(15px);

        }

        to {

            opacity:1;

            transform:
                translateY(0);

        }

    }

`;


document.head.appendChild(
    notificationStyle
);
