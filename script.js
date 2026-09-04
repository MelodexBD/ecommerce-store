// =========================================================
// MELODEX STORE - FINAL SCRIPT.JS
// =========================================================
// Firebase Products
// Category Products
// Product Specific URL
// Multiple Product Images
// Image Modal
// Shopping Cart
// LocalStorage Cart
// WhatsApp Orders
// Notifications
// =========================================================


import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {

    apiKey: "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ",

    authDomain: "melodex-store.firebaseapp.com",

    projectId: "melodex-store",

    storageBucket: "melodex-store.firebasestorage.app",

    messagingSenderId: "563447283369",

    appId: "1:563447283369:web:a999e89adf7380ec4733b8",

    measurementId: "G-G133358KKB"

};


// =========================================================
// WHATSAPP NUMBER
// =========================================================

const WHATSAPP_NUMBER = "8801310863206";


// =========================================================
// FIREBASE INITIALIZE
// =========================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// =========================================================
// FIRESTORE OFFLINE CACHE
// =========================================================

enableIndexedDbPersistence(db).catch((error) => {

    if (error.code === "failed-precondition") {

        console.warn(
            "Firestore persistence is unavailable because multiple tabs are open."
        );

    }

    else if (error.code === "unimplemented") {

        console.warn(
            "Firestore persistence is not supported by this browser."
        );

    }

});


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let products = [];

let cart = [];


// =========================================================
// CATEGORY CONFIG
// =========================================================

const categoryConfig = [

    {
        key: "Guitars",
        containerId: "guitarsContainer"
    },

    {
        key: "Pedals",
        containerId: "pedalsContainer"
    },

    {
        key: "Pedalboards",
        containerId: "pedalboardsContainer"
    },

    {
        key: "Stands",
        containerId: "standsContainer"
    },

    {
        key: "Cables & Accessories",
        containerId: "cablesContainer"
    }

];


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initApp();

    }
);


// =========================================================
// INIT APP
// =========================================================

function initApp() {

    loadCart();

    initializeCartEvents();

    initializeGlobalEvents();

    fetchProducts();

}


// =========================================================
// FETCH PRODUCTS
// =========================================================

async function fetchProducts() {

    showLoading();


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        const firebaseProducts = [];


        snapshot.forEach(
            (docSnapshot) => {

                const data =
                    docSnapshot.data();


                let images = [];


                // ---------------------------------------------
                // MULTIPLE IMAGES
                // ---------------------------------------------

                if (
                    Array.isArray(data.images)
                ) {

                    images =
                        data.images.filter(
                            image =>
                                typeof image === "string" &&
                                image.trim() !== ""
                        );

                }


                // ---------------------------------------------
                // SINGLE IMAGE FALLBACK
                // ---------------------------------------------

                if (
                    images.length === 0 &&
                    data.image
                ) {

                    images = [
                        data.image
                    ];

                }


                firebaseProducts.push({

                    id:
                        docSnapshot.id,

                    name:
                        data.name ||
                        "Unnamed Product",

                    price:
                        Number(
                            data.price || 0
                        ),

                    category:
                        normalizeCategory(
                            data.category
                        ),

                    description:
                        data.description ||
                        "",

                    image:
                        images[0] ||
                        "",

                    images:
                        images

                });

            }
        );


        products =
            firebaseProducts;


        updateProductCount();


        displayProductsByCategory();


        // =====================================================
        // OPEN PRODUCT FROM URL
        // =====================================================

        openProductFromURL();


        console.log(
            `Melodex: ${products.length} products loaded.`
        );

    }

    catch (error) {

        console.error(
            "Firebase product loading error:",
            error
        );


        showError();

    }

}


// =========================================================
// CATEGORY NORMALIZATION
// =========================================================

function normalizeCategory(category) {

    if (!category) {

        return "Cables & Accessories";

    }


    const value =
        String(category)
            .trim()
            .toLowerCase();


    if (
        value === "guitar" ||
        value === "guitars"
    ) {

        return "Guitars";

    }


    if (
        value === "pedal" ||
        value === "pedals"
    ) {

        return "Pedals";

    }


    if (
        value === "pedalboard" ||
        value === "pedalboards"
    ) {

        return "Pedalboards";

    }


    if (
        value === "stand" ||
        value === "stands"
    ) {

        return "Stands";

    }


    if (
        value.includes("cable") ||
        value.includes("accessor")
    ) {

        return "Cables & Accessories";

    }


    return category;

}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

    categoryConfig.forEach(
        category => {

            const container =
                document.getElementById(
                    category.containerId
                );


            if (!container) return;


            container.innerHTML = `

                <div class="products-loading">

                    <i class="fas fa-spinner fa-spin"></i>

                    <span>
                        Products loading...
                    </span>

                </div>

            `;

        }
    );

}


// =========================================================
// ERROR
// =========================================================

function showError() {

    categoryConfig.forEach(
        category => {

            const container =
                document.getElementById(
                    category.containerId
                );


            if (!container) return;


            container.innerHTML = `

                <div class="products-error">

                    <i class="fas fa-triangle-exclamation"></i>

                    <h3>
                        Products load করতে সমস্যা হয়েছে
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>

            `;

        }
    );

}


// =========================================================
// PRODUCT COUNT
// =========================================================

function updateProductCount() {

    const countElement =
        document.getElementById(
            "total-products-count"
        );


    if (countElement) {

        countElement.textContent =
            products.length;

    }

}


// =========================================================
// DISPLAY PRODUCTS BY CATEGORY
// =========================================================

function displayProductsByCategory() {

    categoryConfig.forEach(
        category => {

            const container =
                document.getElementById(
                    category.containerId
                );


            if (!container) return;


            const categoryProducts =
                products.filter(
                    product =>
                        normalizeCategory(
                            product.category
                        ) === category.key
                );


            // ---------------------------------------------
            // EMPTY CATEGORY
            // ---------------------------------------------

            if (
                categoryProducts.length === 0
            ) {

                container.innerHTML = `

                    <div class="empty-category">

                        <i class="fas fa-box-open"></i>

                        <p>
                            এই Category-তে এখনো কোনো Product নেই।
                        </p>

                    </div>

                `;

                return;

            }


            let productsHTML = "";


            // ---------------------------------------------
            // PRODUCT LOOP
            // ---------------------------------------------

            categoryProducts.forEach(
                product => {

                    const images =
                        Array.isArray(
                            product.images
                        ) &&
                        product.images.length > 0

                            ? product.images

                            : (
                                product.image
                                    ? [product.image]
                                    : []
                            );


                    const firstImage =
                        images[0] || "";


                    const productId =
                        String(
                            product.id
                        );


                    const escapedId =
                        escapeHTML(
                            productId
                        );


                    // =========================================
                    // PRODUCT CARD
                    // =========================================

                    productsHTML += `

                        <div
                            class="product-card"
                            id="product-${escapedId}"
                            data-product-id="${escapedId}"
                        >

                            <!-- PRODUCT IMAGE -->

                            <div
                                class="product-image-wrapper"
                            >

                                ${
                                    firstImage

                                        ? `

                                            <img
                                                src="${escapeHTML(firstImage)}"
                                                alt="${escapeHTML(product.name)}"
                                                class="product-main-image"
                                                id="main-img-${escapedId}"
                                                data-action="main-image"
                                                data-product-id="${escapedId}"
                                                loading="lazy"
                                            >

                                        `

                                        : `

                                            <div
                                                class="product-no-image"
                                            >

                                                <i class="fas fa-image"></i>

                                            </div>

                                        `
                                }


                                ${
                                    firstImage

                                        ? `

                                            <button
                                                type="button"
                                                class="image-zoom-btn"
                                                data-action="zoom"
                                                data-product-id="${escapedId}"
                                                aria-label="View product image"
                                            >

                                                <i class="fas fa-expand"></i>

                                            </button>

                                        `

                                        : ""
                                }


                                ${
                                    images.length > 1

                                        ? `

                                            <div
                                                class="product-thumbnails"
                                            >

                                                ${images
                                                    .map(
                                                        (image, index) => `

                                                            <button
                                                                type="button"
                                                                class="product-thumbnail ${
                                                                    index === 0
                                                                        ? "active"
                                                                        : ""
                                                                }"
                                                                data-action="thumbnail"
                                                                data-product-id="${escapedId}"
                                                                data-image-index="${index}"
                                                            >

                                                                <img
                                                                    src="${escapeHTML(image)}"
                                                                    alt="${escapeHTML(product.name)} image ${index + 1}"
                                                                    loading="lazy"
                                                                >

                                                            </button>

                                                        `
                                                    )
                                                    .join("")}

                                            </div>

                                        `

                                        : ""
                                }

                            </div>


                            <!-- PRODUCT DETAILS -->

                            <div
                                class="product-info"
                            >

                                <h3
                                    class="product-name"
                                >

                                    ${escapeHTML(
                                        product.name
                                    )}

                                </h3>


                                ${
                                    product.description

                                        ? `

                                            <p
                                                class="product-description"
                                            >

                                                ${escapeHTML(
                                                    product.description
                                                )}

                                            </p>

                                        `

                                        : ""
                                }


                                <div
                                    class="product-price"
                                >

                                    ৳ ${formatPrice(
                                        product.price
                                    )}

                                </div>


                                <!-- PRODUCT BUTTONS -->

                                <div
                                    class="product-buttons"
                                >

                                    <button
                                        type="button"
                                        class="add-to-cart-btn"
                                        data-action="add-cart"
                                        data-product-id="${escapedId}"
                                    >

                                        <i class="fas fa-cart-plus"></i>

                                        Add to Cart

                                    </button>


                                    <button
                                        type="button"
                                        class="order-now-btn"
                                        data-action="order-now"
                                        data-product-id="${escapedId}"
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


            container.innerHTML =
                productsHTML;

        }
    );

}


// =========================================================
// OPEN PRODUCT FROM URL
// =========================================================

function openProductFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const productId =
        params.get(
            "product"
        );


    if (!productId) {

        return;

    }


    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        console.warn(
            "Product not found:",
            productId
        );

        return;

    }


    // ---------------------------------------------------------
    // PRODUCT CATEGORY
    // ---------------------------------------------------------

    const category =
        normalizeCategory(
            product.category
        );


    // Category section-এ যেতে সাহায্য করবে
    const categoryMap = {

        "Guitars":
            "guitars",

        "Pedals":
            "pedals",

        "Pedalboards":
            "pedalboards",

        "Stands":
            "stands",

        "Cables & Accessories":
            "cables"

    };


    const sectionId =
        categoryMap[
            category
        ];


    // ---------------------------------------------------------
    // WAIT FOR DOM
    // ---------------------------------------------------------

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


            // -------------------------------------------------
            // SCROLL
            // -------------------------------------------------

            productElement.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });


            // -------------------------------------------------
            // ORIGINAL STYLE SAVE
            // -------------------------------------------------

            const oldBoxShadow =
                productElement.style.boxShadow;

            const oldTransform =
                productElement.style.transform;

            const oldTransition =
                productElement.style.transition;


            // -------------------------------------------------
            // HIGHLIGHT
            // -------------------------------------------------

            productElement.style.transition =
                "all 0.4s ease";


            productElement.style.boxShadow =
                "0 0 0 3px #ef4444, 0 0 35px rgba(239,68,68,0.55)";


            productElement.style.transform =
                "scale(1.02)";


            // -------------------------------------------------
            // REMOVE HIGHLIGHT
            // -------------------------------------------------

            setTimeout(
                () => {

                    productElement.style.boxShadow =
                        oldBoxShadow;

                    productElement.style.transform =
                        oldTransform;

                    productElement.style.transition =
                        oldTransition;

                },
                3000
            );


        },
        700
    );

}


// =========================================================
// GLOBAL EVENTS
// =========================================================

function initializeGlobalEvents() {

    // ---------------------------------------------------------
    // PRODUCT ACTIONS
    // ---------------------------------------------------------

    document.addEventListener(
        "click",
        handleProductActions
    );


    // ---------------------------------------------------------
    // ESCAPE
    // ---------------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeCart();

                closeImageModal();

            }

        }
    );


    // ---------------------------------------------------------
    // CART BUTTON
    // ---------------------------------------------------------

    const cartButton =
        document.getElementById(
            "cartButton"
        );


    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    // ---------------------------------------------------------
    // CLOSE CART
    // ---------------------------------------------------------

    const closeCartButton =
        document.getElementById(
            "closeCart"
        );


    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );

    }


    // ---------------------------------------------------------
    // CART OVERLAY
    // ---------------------------------------------------------

    const cartOverlay =
        document.getElementById(
            "cartOverlay"
        );


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    // ---------------------------------------------------------
    // CHECKOUT
    // ---------------------------------------------------------

    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            checkoutCart
        );

    }


    // ---------------------------------------------------------
    // IMAGE MODAL CLOSE
    // ---------------------------------------------------------

    const imageModal =
        document.getElementById(
            "imageModal"
        );


    const imageModalClose =
        document.getElementById(
            "imageModalClose"
        );


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
                    event.target === imageModal
                ) {

                    closeImageModal();

                }

            }
        );

    }


    // ---------------------------------------------------------
    // NAVIGATION LINKS
    // ---------------------------------------------------------

    document.addEventListener(
        "click",
        event => {

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


// =========================================================
// CART EVENTS
// =========================================================

function initializeCartEvents() {

    renderCart();

}


// =========================================================
// HANDLE PRODUCT ACTIONS
// =========================================================

function handleProductActions(event) {

    const element =
        event.target.closest(
            "[data-action]"
        );


    if (!element) {

        return;

    }


    const action =
        element.dataset.action;


    const productId =
        element.dataset.productId;


    // ---------------------------------------------------------
    // ADD CART
    // ---------------------------------------------------------

    if (
        action === "add-cart"
    ) {

        addToCart(
            productId
        );

        return;

    }


    // ---------------------------------------------------------
    // ORDER NOW
    // ---------------------------------------------------------

    if (
        action === "order-now"
    ) {

        orderSingleProduct(
            productId
        );

        return;

    }


    // ---------------------------------------------------------
    // ZOOM
    // ---------------------------------------------------------

    if (
        action === "zoom"
    ) {

        openProductImage(
            productId
        );

        return;

    }


    // ---------------------------------------------------------
    // MAIN IMAGE
    // ---------------------------------------------------------

    if (
        action === "main-image"
    ) {

        openProductImage(
            productId
        );

        return;

    }


    // ---------------------------------------------------------
    // THUMBNAIL
    // ---------------------------------------------------------

    if (
        action === "thumbnail"
    ) {

        const imageIndex =
            Number(
                element.dataset.imageIndex
            );


        changeProductImage(
            productId,
            imageIndex
        );

        return;

    }


    // ---------------------------------------------------------
    // CART PLUS
    // ---------------------------------------------------------

    if (
        action === "cart-plus"
    ) {

        changeCartQuantity(
            productId,
            1
        );

        return;

    }


    // ---------------------------------------------------------
    // CART MINUS
    // ---------------------------------------------------------

    if (
        action === "cart-minus"
    ) {

        changeCartQuantity(
            productId,
            -1
        );

        return;

    }


    // ---------------------------------------------------------
    // CART REMOVE
    // ---------------------------------------------------------

    if (
        action === "cart-remove"
    ) {

        removeFromCart(
            productId
        );

        return;

    }

}


// =========================================================
// CHANGE PRODUCT IMAGE
// =========================================================

function changeProductImage(
    productId,
    imageIndex
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) return;


    const images =
        Array.isArray(
            product.images
        )
            ? product.images
            : [];


    if (
        !images[imageIndex]
    ) {

        return;

    }


    const mainImage =
        document.getElementById(
            `main-img-${productId}`
        );


    if (mainImage) {

        mainImage.src =
            images[imageIndex];

    }


    const productCard =
        document.getElementById(
            `product-${productId}`
        );


    if (!productCard) return;


    const thumbnails =
        productCard.querySelectorAll(
            ".product-thumbnail"
        );


    thumbnails.forEach(
        (
            thumbnail,
            index
        ) => {

            thumbnail.classList.toggle(
                "active",
                index === imageIndex
            );

        }
    );

}


// =========================================================
// OPEN PRODUCT IMAGE
// =========================================================

function openProductImage(
    productId
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) return;


    const images =
        Array.isArray(
            product.images
        ) &&
        product.images.length > 0

            ? product.images

            : (
                product.image
                    ? [product.image]
                    : []
            );


    if (
        images.length === 0
    ) {

        return;

    }


    const modal =
        document.getElementById(
            "imageModal"
        );


    const modalImage =
        document.getElementById(
            "modalImage"
        );


    if (
        !modal ||
        !modalImage
    ) {

        return;

    }


    // ---------------------------------------------------------
    // FIRST IMAGE
    // ---------------------------------------------------------

    modalImage.src =
        images[0];


    modalImage.alt =
        product.name;


    // ---------------------------------------------------------
    // STORE IMAGES
    // ---------------------------------------------------------

    modal.dataset.productId =
        String(productId);


    modal.dataset.currentIndex =
        "0";


    modal.dataset.images =
        JSON.stringify(
            images
        );


    // ---------------------------------------------------------
    // OPEN
    // ---------------------------------------------------------

    modal.classList.add(
        "active"
    );


    modal.style.display =
        "flex";


    document.body.style.overflow =
        "hidden";

}


// =========================================================
// CLOSE IMAGE MODAL
// =========================================================

function closeImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    modal.style.display =
        "";


    const modalImage =
        document.getElementById(
            "modalImage"
        );


    if (modalImage) {

        modalImage.src =
            "";

    }


    document.body.style.overflow =
        "";

}


// =========================================================
// CART LOAD
// =========================================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(
                "melodex_cart"
            );


        if (savedCart) {

            cart =
                JSON.parse(
                    savedCart
                );

        }

        else {

            cart = [];

        }


        if (
            !Array.isArray(cart)
        ) {

            cart = [];

        }

    }

    catch (error) {

        console.error(
            "Cart loading error:",
            error
        );


        cart = [];

    }


    renderCart();

}


// =========================================================
// CART SAVE
// =========================================================

function saveCart() {

    try {

        localStorage.setItem(
            "melodex_cart",
            JSON.stringify(
                cart
            )
        );

    }

    catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


// =========================================================
// ADD TO CART
// =========================================================

function addToCart(
    productId
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        showNotification(
            "Product পাওয়া যায়নি!",
            "error"
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 1
            ) + 1;

    }

    else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(
                    product.price || 0
                ),

            image:
                product.image ||
                "",

            quantity:
                1

        });

    }


    saveCart();

    renderCart();


    showNotification(
        `${product.name} Cart-এ যোগ হয়েছে ✓`,
        "success"
    );

}


// =========================================================
// CHANGE CART QUANTITY
// =========================================================

function changeCartQuantity(
    productId,
    amount
) {

    const item =
        cart.find(
            product =>
                String(product.id) ===
                String(productId)
        );


    if (!item) return;


    item.quantity =
        Number(
            item.quantity || 1
        ) + amount;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                product =>
                    String(product.id) !==
                    String(productId)
            );

    }


    saveCart();

    renderCart();

}


// =========================================================
// REMOVE FROM CART
// =========================================================

function removeFromCart(
    productId
) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCart();

    renderCart();


    showNotification(
        "Product Cart থেকে Remove হয়েছে",
        "success"
    );

}


// =========================================================
// RENDER CART
// =========================================================

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


    if (
        !cartItems
    ) {

        return;

    }


    // ---------------------------------------------------------
    // EMPTY CART
    // ---------------------------------------------------------

    if (
        cart.length === 0
    ) {

        cartItems.innerHTML =
            "";


        if (cartEmpty) {

            cartEmpty.style.display =
                "flex";

        }


        if (cartFooter) {

            cartFooter.style.display =
                "none";

        }


        updateCartCount();

        updateCartTotal();

        return;

    }


    // ---------------------------------------------------------
    // CART HAS PRODUCTS
    // ---------------------------------------------------------

    if (cartEmpty) {

        cartEmpty.style.display =
            "none";

    }


    if (cartFooter) {

        cartFooter.style.display =
            "";

    }


    cartItems.innerHTML =
        cart
            .map(
                item => {

                    const quantity =
                        Number(
                            item.quantity || 1
                        );


                    const price =
                        Number(
                            item.price || 0
                        );


                    const subtotal =
                        price *
                        quantity;


                    return `

                        <div
                            class="cart-item"
                        >

                            <div
                                class="cart-item-image"
                            >

                                ${
                                    item.image

                                        ? `

                                            <img
                                                src="${escapeHTML(item.image)}"
                                                alt="${escapeHTML(item.name)}"
                                            >

                                        `

                                        : `

                                            <i class="fas fa-image"></i>

                                        `
                                }

                            </div>


                            <div
                                class="cart-item-details"
                            >

                                <h4>

                                    ${escapeHTML(
                                        item.name
                                    )}

                                </h4>


                                <p>

                                    ৳ ${formatPrice(
                                        price
                                    )}

                                </p>


                                <div
                                    class="cart-quantity"
                                >

                                    <button
                                        type="button"
                                        data-action="cart-minus"
                                        data-product-id="${escapeHTML(String(item.id))}"
                                        aria-label="Decrease quantity"
                                    >

                                        −

                                    </button>


                                    <span>

                                        ${quantity}

                                    </span>


                                    <button
                                        type="button"
                                        data-action="cart-plus"
                                        data-product-id="${escapeHTML(String(item.id))}"
                                        aria-label="Increase quantity"
                                    >

                                        +

                                    </button>

                                </div>

                            </div>


                            <div
                                class="cart-item-right"
                            >

                                <strong>

                                    ৳ ${formatPrice(
                                        subtotal
                                    )}

                                </strong>


                                <button
                                    type="button"
                                    class="cart-remove-btn"
                                    data-action="cart-remove"
                                    data-product-id="${escapeHTML(String(item.id))}"
                                    aria-label="Remove product"
                                >

                                    <i class="fas fa-trash"></i>

                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    updateCartCount();

    updateCartTotal();

}


// =========================================================
// UPDATE CART COUNT
// =========================================================

function updateCartCount() {

    const count =
        cart.reduce(
            (
                total,
                item
            ) => {

                return total +
                    Number(
                        item.quantity || 1
                    );

            },
            0
        );


    const cartCount =
        document.querySelector(
            ".cart-count"
        );


    if (cartCount) {

        cartCount.textContent =
            count;

        if (
            count > 0
        ) {

            cartCount.classList.add(
                "has-items"
            );

        }

        else {

            cartCount.classList.remove(
                "has-items"
            );

        }

    }

}


// =========================================================
// UPDATE CART TOTAL
// =========================================================

function updateCartTotal() {

    const total =
        cart.reduce(
            (
                sum,
                item
            ) => {

                return sum +
                    (
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 1
                        )
                    );

            },
            0
        );


    const cartTotal =
        document.getElementById(
            "cartTotal"
        );


    if (cartTotal) {

        cartTotal.textContent =
            `৳ ${formatPrice(total)}`;

    }

}


// =========================================================
// OPEN CART
// =========================================================

function openCart() {

    const sidebar =
        document.getElementById(
            "cartSidebar"
        );


    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (sidebar) {

        sidebar.classList.add(
            "active"
        );

    }


    if (overlay) {

        overlay.classList.add(
            "active"
        );

    }


    document.body.style.overflow =
        "hidden";

}


// =========================================================
// CLOSE CART
// =========================================================

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


    document.body.style.overflow =
        "";

}


// =========================================================
// SINGLE PRODUCT ORDER
// =========================================================

function orderSingleProduct(
    productId
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        showNotification(
            "Product পাওয়া যায়নি!",
            "error"
        );

        return;

    }


    const message =

        `🎸 *MELODEX STORE - NEW ORDER*\n\n` +

        `*Product:* ${product.name}\n` +

        `*Price:* ৳ ${formatPrice(product.price)}\n` +

        `*Quantity:* 1\n\n` +

        `আমি এই Product টি Order করতে চাই।\n\n` +

        `Please confirm my order.`;


    openWhatsApp(
        message
    );

}


// =========================================================
// CART CHECKOUT
// =========================================================

function checkoutCart() {

    if (
        cart.length === 0
    ) {

        showNotification(
            "আপনার Cart খালি!",
            "error"
        );

        return;

    }


    let message =
        `🎸 *MELODEX STORE - NEW ORDER*\n\n`;


    message +=
        `*ORDER ITEMS:*\n\n`;


    cart.forEach(
        (
            item,
            index
        ) => {

            const price =
                Number(
                    item.price || 0
                );


            const quantity =
                Number(
                    item.quantity || 1
                );


            const subtotal =
                price *
                quantity;


            message +=

                `${index + 1}. ${item.name}\n` +

                `   Price: ৳ ${formatPrice(price)}\n` +

                `   Quantity: ${quantity}\n` +

                `   Subtotal: ৳ ${formatPrice(subtotal)}\n\n`;

        }
    );


    const total =
        cart.reduce(
            (
                sum,
                item
            ) => {

                return sum +
                    (
                        Number(
                            item.price || 0
                        ) *
                        Number(
                            item.quantity || 1
                        )
                    );

            },
            0
        );


    message +=
        `*TOTAL: ৳ ${formatPrice(total)}*\n\n`;


    message +=
        `আমি উপরের Product গুলো Order করতে চাই।\n\n`;


    message +=
        `Please confirm my order.`;



    openWhatsApp(
        message
    );

}


// =========================================================
// OPEN WHATSAPP
// =========================================================

function openWhatsApp(
    message
) {

    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(
            message
        );


    window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
    );

}


// =========================================================
// NOTIFICATION
// =========================================================

function showNotification(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "notificationContainer"
        );


    if (!container) {

        alert(
            message
        );

        return;

    }


    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        `melodex-notification ${type}`;


    notification.innerHTML = `

        <i class="${
            type === "error"
                ? "fas fa-circle-exclamation"
                : "fas fa-circle-check"
        }"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    container.appendChild(
        notification
    );


    requestAnimationFrame(
        () => {

            notification.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            notification.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    notification.remove();

                },
                300
            );

        },
        2500
    );

}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(
    price
) {

    return Number(
        price || 0
    ).toLocaleString(
        "en-BD"
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


// =========================================================
// EXTRA DYNAMIC CSS
// =========================================================

(function addDynamicStyles() {

    if (
        document.getElementById(
            "melodex-script-styles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "melodex-script-styles";


    style.textContent = `

        /* ===============================================
           PRODUCT IMAGE
        =============================================== */

        .product-image-wrapper {

            position: relative;

            width: 100%;

            aspect-ratio: 1 / 1;

            overflow: hidden;

        }


        .product-main-image {

            width: 100%;

            height: 100%;

            object-fit: cover;

            aspect-ratio: 1 / 1;

            cursor: zoom-in;

            display: block;

        }


        .product-no-image {

            width: 100%;

            height: 100%;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #f1f5f9;

            color: #94a3b8;

            font-size: 40px;

        }


        /* ===============================================
           ZOOM BUTTON
        =============================================== */

        .image-zoom-btn {

            position: absolute;

            right: 10px;

            top: 10px;

            width: 40px;

            height: 40px;

            padding: 0;

            border: none;

            border-radius: 50%;

            background: rgba(0,0,0,0.65);

            color: #ffffff;

            cursor: pointer;

            z-index: 5;

        }


        .image-zoom-btn:hover {

            background: #ef4444;

        }


        /* ===============================================
           THUMBNAILS
        =============================================== */

        .product-thumbnails {

            position: absolute;

            left: 10px;

            right: 10px;

            bottom: 10px;

            display: flex;

            gap: 7px;

            overflow-x: auto;

            z-index: 5;

        }


        .product-thumbnail {

            width: 50px;

            height: 50px;

            flex: 0 0 50px;

            padding: 2px;

            border: 2px solid transparent;

            border-radius: 7px;

            background: rgba(0,0,0,0.55);

            cursor: pointer;

        }


        .product-thumbnail.active {

            border-color: #ef4444;

        }


        .product-thumbnail img {

            width: 100%;

            height: 100%;

            object-fit: cover;

            aspect-ratio: 1 / 1;

            border-radius: 4px;

            display: block;

        }


        /* ===============================================
           IMAGE MODAL
        =============================================== */

        #imageModal {

            align-items: center;

            justify-content: center;

        }


        #imageModal.active {

            display: flex !important;

        }


        #imageModal img {

            max-width: 90vw;

            max-height: 85vh;

            width: auto;

            height: auto;

            object-fit: contain;

        }


        /* ===============================================
           NOTIFICATION
        =============================================== */

        #notificationContainer {

            position: fixed;

            right: 20px;

            bottom: 20px;

            z-index: 999999;

            display: flex;

            flex-direction: column;

            gap: 10px;

            pointer-events: none;

        }


        .melodex-notification {

            display: flex;

            align-items: center;

            gap: 10px;

            min-width: 250px;

            max-width: 380px;

            padding: 13px 17px;

            border-radius: 10px;

            background: #16a34a;

            color: #ffffff;

            box-shadow:
                0 12px 30px rgba(0,0,0,0.25);

            transform: translateY(30px);

            opacity: 0;

            transition: all 0.3s ease;

            font-size: 14px;

            font-weight: 600;

        }


        .melodex-notification.show {

            transform: translateY(0);

            opacity: 1;

        }


        .melodex-notification.error {

            background: #dc2626;

        }


        /* ===============================================
           LOADING
        =============================================== */

        .products-loading {

            min-height: 160px;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 10px;

            color: #94a3b8;

        }


        .products-error {

            text-align: center;

            padding: 40px 20px;

            color: #ef4444;

        }


        .empty-category {

            text-align: center;

            padding: 40px 20px;

            color: #94a3b8;

        }


        /* ===============================================
           CART ITEM FALLBACK
        =============================================== */

        .cart-item-image {

            width: 70px;

            height: 70px;

            flex: 0 0 70px;

            aspect-ratio: 1 / 1;

            overflow: hidden;

            border-radius: 8px;

        }


        .cart-item-image img {

            width: 100%;

            height: 100%;

            object-fit: cover;

            aspect-ratio: 1 / 1;

        }


        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 600px) {

            #notificationContainer {

                left: 15px;

                right: 15px;

                bottom: 15px;

            }


            .melodex-notification {

                min-width: 0;

                width: 100%;

            }


            .product-thumbnail {

                width: 44px;

                height: 44px;

                flex-basis: 44px;

            }


            .image-zoom-btn {

                width: 36px;

                height: 36px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

})();
