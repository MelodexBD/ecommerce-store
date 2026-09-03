// ============================================
// MELODEX E-COMMERCE STORE
// COMPLETE SCRIPT.JS
// ============================================


// ============================================
// FIREBASE IMPORTS
// ============================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";


// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {

    apiKey: "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ",

    authDomain: "melodex-store.firebaseapp.com",

    projectId: "melodex-store",

    storageBucket: "melodex-store.firebasestorage.app",

    messagingSenderId: "563447283369",

    appId: "1:563447283369:web:a999e89adf7380ec4733b8",

    measurementId: "G-G133358KKB"

};


// ============================================
// INITIALIZE FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ============================================
// GLOBAL DATA
// ============================================

let products = [];

let cart = [];

let currentLightboxImages = [];

let currentLightboxIndex = 0;


// ============================================
// WHATSAPP NUMBER
// ============================================

const WHATSAPP_NUMBER = "8801310863206";


// ============================================
// NORMALIZE CATEGORY
// ============================================

function normalizeCategory(cat) {

    if (!cat) {

        return "guitars";

    }


    const c = cat
        .toLowerCase()
        .trim();


    if (c.includes("guitar")) {

        return "guitars";

    }


    if (c.includes("pedalboard")) {

        return "pedalboards";

    }


    if (c.includes("pedal")) {

        return "pedals";

    }


    if (c.includes("stand")) {

        return "stands";

    }


    if (
        c.includes("cable") ||
        c.includes("accessories") ||
        c.includes("accessory")
    ) {

        return "cables";

    }


    return c;

}


// ============================================
// GET CATEGORY NAME
// ============================================

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


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ============================================
// FORMAT PRICE
// ============================================

function formatPrice(price) {

    const numberPrice =
        Number(price) || 0;


    return numberPrice.toLocaleString(
        "en-BD"
    );

}


// ============================================
// GET PRODUCT IMAGES
// ============================================

function getProductImages(data) {

    let images = [];


    if (
        Array.isArray(data.images) &&
        data.images.length > 0
    ) {

        images = data.images;

    }

    else if (data.image) {

        images = [data.image];

    }

    else if (data.imageUrl) {

        images = [data.imageUrl];

    }


    return images.filter(
        image =>
            image &&
            typeof image === "string"
    );

}


// ============================================
// FETCH PRODUCTS
// ============================================

async function fetchFirebaseProducts() {

    try {

        const querySnapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        const firebaseProducts = [];


        querySnapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                const images =
                    getProductImages(data);


                firebaseProducts.push({

                    id:
                        documentSnapshot.id,

                    name:
                        data.name ||
                        "Unnamed Product",

                    category:
                        normalizeCategory(
                            data.category
                        ),

                    price:
                        Number(data.price) || 0,

                    image:
                        images[0] || "",

                    images:

                        images,

                    description:
                        data.description || ""

                });

            }
        );


        products =
            firebaseProducts;


        // PRODUCT COUNT

        const countElement =
            document.getElementById(
                "total-products-count"
            );


        if (countElement) {

            countElement.textContent =
                products.length;

        }


    }

    catch (error) {

        console.error(
            "Firebase fetch failed:",
            error
        );


        showNotification(
            "Unable to load products."
        );

    }

}


// ============================================
// CHANGE PRODUCT IMAGE
// ============================================

window.changeProductImage =
function (
    productId,
    imageIndex
) {

    const product =
        products.find(
            product =>
                String(product.id) ===
                String(productId)
        );


    if (!product) {

        return;

    }


    const image =
        product.images[imageIndex];


    const mainImage =
        document.getElementById(
            `main-img-${productId}`
        );


    if (mainImage) {

        mainImage.src =
            image;

    }


    const thumbnailContainer =
        document.getElementById(
            `thumbs-${productId}`
        );


    if (thumbnailContainer) {

        const thumbnails =
            thumbnailContainer.querySelectorAll(
                ".thumb-img"
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

};


// ============================================
// OPEN PRODUCT IMAGE
// ============================================

window.openProductImage =
function (
    productId
) {

    const product =
        products.find(
            product =>
                String(product.id) ===
                String(productId)
        );


    if (
        !product ||
        !product.images ||
        product.images.length === 0
    ) {

        return;

    }


    const mainImage =
        document.getElementById(
            `main-img-${productId}`
        );


    let startIndex = 0;


    if (mainImage) {

        startIndex =
            product.images.indexOf(
                mainImage.src
            );


        if (startIndex < 0) {

            startIndex = 0;

        }

    }


    openLightbox(
        product.images,
        startIndex
    );

};


// ============================================
// DISPLAY PRODUCTS
// ============================================

function displayProductsByCategory() {

    const categories = [

        "guitars",

        "pedals",

        "pedalboards",

        "stands",

        "cables"

    ];


    categories.forEach(
        category => {

            const container =
                document.getElementById(
                    category + "Container"
                );


            if (!container) {

                return;

            }


            const categoryProducts =
                products.filter(
                    product =>
                        product.category ===
                        category
                );


            container.innerHTML = "";


            if (
                categoryProducts.length === 0
            ) {

                container.innerHTML = `

                    <p
                        class="empty-category"
                    >

                        No products available
                        in this category yet.

                    </p>

                `;


                return;

            }


            categoryProducts.forEach(
                product => {

                    let thumbnailsHTML =
                        "";


                    if (
                        product.images.length > 1
                    ) {

                        thumbnailsHTML = `

                            <div
                                class="product-thumbnails"
                                id="thumbs-${product.id}"
                            >

                        `;


                        product.images.forEach(
                            (
                                image,
                                index
                            ) => {

                                thumbnailsHTML += `

                                    <img
                                        src="${escapeHTML(image)}"
                                        class="thumb-img ${
                                            index === 0
                                                ? "active"
                                                : ""
                                        }"
                                        onclick="window.changeProductImage(
                                            '${product.id}',
                                            ${index}
                                        )"
                                        alt="Product thumbnail"
                                    >

                                `;

                            }
                        );


                        thumbnailsHTML +=
                            "</div>";

                    }


                    const productHTML = `

                        <article
                            class="product-card"
                            id="card-${product.id}"
                        >


                            <div
                                class="product-image-container"
                            >


                                <img
                                    src="${escapeHTML(product.image)}"
                                    alt="${escapeHTML(product.name)}"
                                    class="product-image"
                                    id="main-img-${product.id}"
                                    onclick="window.openProductImage('${product.id}')"
                                >


                                <button
                                    class="image-view-btn"
                                    onclick="window.openProductImage('${product.id}')"
                                    title="View Image"
                                >

                                    <i class="fas fa-expand"></i>

                                </button>


                            </div>


                            ${thumbnailsHTML}


                            <div
                                class="product-info"
                            >


                                <span
                                    class="product-category"
                                >

                                    ${getCategoryName(
                                        product.category
                                    )}

                                </span>


                                <h3
                                    class="product-name"
                                >

                                    ${escapeHTML(
                                        product.name
                                    )}

                                </h3>


                                <p
                                    class="product-description"
                                >

                                    ${escapeHTML(
                                        product.description
                                    )}

                                </p>


                                <div
                                    class="product-price"
                                >

                                    ৳ ${formatPrice(
                                        product.price
                                    )}

                                </div>


                                <div
                                    class="product-actions"
                                >


                                    <button
                                        class="btn-add-cart"
                                        onclick="window.addToCart('${product.id}')"
                                    >

                                        <i
                                            class="fas fa-shopping-cart"
                                        ></i>

                                        Add to Cart

                                    </button>


                                    <button
                                        class="btn btn-whatsapp"
                                        onclick="window.orderSingleProduct('${product.id}')"
                                    >

                                        <i
                                            class="fab fa-whatsapp"
                                        ></i>

                                        Order Now

                                    </button>


                                </div>


                            </div>


                        </article>

                    `;


                    container.innerHTML +=
                        productHTML;

                }
            );

        }
    );

}


// ============================================
// SINGLE PRODUCT WHATSAPP ORDER
// ============================================

window.orderSingleProduct =
function (
    productId
) {

    const product =
        products.find(
            product =>
                String(product.id) ===
                String(productId)
        );


    if (!product) {

        return;

    }


    let message =
        "Hello Melodex! 👋\n\n";


    message +=
        "I am interested in:\n\n";


    message +=
        `Product: ${product.name}\n`;


    message +=
        `Price: ৳ ${formatPrice(product.price)}\n\n`;


    message +=
        "Please provide more information.";


    const url =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            message
        )}`;


    window.open(
        url,
        "_blank"
    );

};


// ============================================
// LOAD CART
// ============================================

function loadCartFromStorage() {

    try {

        const savedCart =
            localStorage.getItem(
                "melodexCart"
            );


        if (savedCart) {

            cart =
                JSON.parse(
                    savedCart
                );

        }

    }

    catch (error) {

        console.error(
            "Cart load error:",
            error
        );


        cart = [];

    }

}


// ============================================
// SAVE CART
// ============================================

function saveCartToStorage() {

    localStorage.setItem(

        "melodexCart",

        JSON.stringify(
            cart
        )

    );

}


// ============================================
// ADD TO CART
// ============================================

window.addToCart =
function (
    productId
) {

    const product =
        products.find(
            product =>
                String(product.id) ===
                String(productId)
        );


    if (!product) {

        return;

    }


    const existingProduct =
        cart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existingProduct) {

        existingProduct.quantity += 1;

    }

    else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                product.price,

            image:
                product.image,

            quantity:
                1

        });

    }


    saveCartToStorage();

    updateCartUI();


    showNotification(
        `${product.name} added to cart!`
    );


    openCart();

};


// ============================================
// UPDATE CART
// ============================================

function updateCartUI() {

    const cartCount =
        document.querySelector(
            ".cart-count"
        );


    const totalQuantity =
        cart.reduce(

            (
                total,
                item
            ) =>

                total +
                Number(item.quantity),

            0

        );


    if (cartCount) {

        cartCount.textContent =
            totalQuantity;

    }


    const cartItems =
        document.getElementById(
            "cart-items"
        );


    const cartEmpty =
        document.getElementById(
            "cart-empty"
        );


    const cartFooter =
        document.getElementById(
            "cart-footer"
        );


    const cartTotal =
        document.getElementById(
            "cart-total"
        );


    if (!cartItems) {

        return;

    }


    if (cart.length === 0) {

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


    cartItems.innerHTML =
        cart.map(
            item => {

                const itemTotal =
                    item.price *
                    item.quantity;


                return `

                    <div
                        class="cart-item"
                    >


                        <img
                            src="${escapeHTML(
                                item.image
                            )}"
                            alt="${escapeHTML(
                                item.name
                            )}"
                            class="cart-product-image"
                        >


                        <div
                            class="cart-item-info"
                        >


                            <div
                                class="cart-item-header"
                            >


                                <h3>

                                    ${escapeHTML(
                                        item.name
                                    )}

                                </h3>


                                <button
                                    class="remove-cart-item"
                                    onclick="window.removeFromCart('${item.id}')"
                                >

                                    <i
                                        class="fas fa-times"
                                    ></i>

                                </button>


                            </div>


                            <p>

                                ৳ ${formatPrice(
                                    item.price
                                )}

                            </p>


                            <div
                                class="cart-item-bottom"
                            >


                                <div
                                    class="quantity-controls"
                                >


                                    <button
                                        onclick="window.changeCartQuantity(
                                            '${item.id}',
                                            -1
                                        )"
                                    >

                                        <i
                                            class="fas fa-minus"
                                        ></i>

                                    </button>


                                    <span>

                                        ${item.quantity}

                                    </span>


                                    <button
                                        onclick="window.changeCartQuantity(
                                            '${item.id}',
                                            1
                                        )"
                                    >

                                        <i
                                            class="fas fa-plus"
                                        ></i>

                                    </button>


                                </div>


                                <strong>

                                    ৳ ${formatPrice(
                                        itemTotal
                                    )}

                                </strong>


                            </div>


                        </div>


                    </div>

                `;

            }
        ).join("");


    const totalPrice =
        cart.reduce(

            (
                total,
                item
            ) =>

                total +
                (
                    item.price *
                    item.quantity
                ),

            0

        );


    if (cartTotal) {

        cartTotal.textContent =
            `৳ ${formatPrice(
                totalPrice
            )}`;

    }

}


// ============================================
// CHANGE QUANTITY
// ============================================

window.changeCartQuantity =
function (
    productId,
    change
) {

    const item =
        cart.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!item) {

        return;

    }


    item.quantity +=
        Number(change);


    if (
        item.quantity <= 0
    ) {

        window.removeFromCart(
            productId
        );

        return;

    }


    saveCartToStorage();

    updateCartUI();

};


// ============================================
// REMOVE FROM CART
// ============================================

window.removeFromCart =
function (
    productId
) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCartToStorage();

    updateCartUI();

};


// ============================================
// CLEAR CART
// ============================================

function clearCart() {

    if (cart.length === 0) {

        return;

    }


    const confirmClear =
        confirm(
            "Are you sure you want to clear your cart?"
        );


    if (!confirmClear) {

        return;

    }


    cart = [];


    saveCartToStorage();

    updateCartUI();

}


// ============================================
// OPEN CART
// ============================================

function openCart() {

    const drawer =
        document.getElementById(
            "cart-drawer"
        );


    const overlay =
        document.getElementById(
            "cart-overlay"
        );


    if (drawer) {

        drawer.classList.add(
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


// ============================================
// CLOSE CART
// ============================================

function closeCart() {

    const drawer =
        document.getElementById(
            "cart-drawer"
        );


    const overlay =
        document.getElementById(
            "cart-overlay"
        );


    if (drawer) {

        drawer.classList.remove(
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


// ============================================
// WHATSAPP CHECKOUT
// ============================================

function checkoutWhatsApp() {

    if (cart.length === 0) {

        showNotification(
            "Your cart is empty."
        );

        return;

    }


    let message =
        "Hello Melodex! 👋\n\n";


    message +=
        "I would like to order these products:\n\n";


    cart.forEach(
        (
            item,
            index
        ) => {

            const subtotal =
                item.price *
                item.quantity;


            message +=
                `${index + 1}. ${item.name}\n`;


            message +=
                `Quantity: ${item.quantity}\n`;


            message +=
                `Price: ৳ ${formatPrice(
                    item.price
                )}\n`;


            message +=
                `Subtotal: ৳ ${formatPrice(
                    subtotal
                )}\n\n`;

        }
    );


    const total =
        cart.reduce(

            (
                sum,
                item
            ) =>

                sum +
                (
                    item.price *
                    item.quantity
                ),

            0

        );


    message +=
        "--------------------------\n";


    message +=
        `TOTAL: ৳ ${formatPrice(
            total
        )}\n\n`;


    message +=
        "Please confirm my order. Thank you!";


    const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            message
        )}`;


    window.open(
        whatsappURL,
        "_blank"
    );

}


// ============================================
// LIGHTBOX
// ============================================

function openLightbox(
    images,
    index = 0
) {

    currentLightboxImages =
        images;


    currentLightboxIndex =
        index;


    const lightbox =
        document.getElementById(
            "image-lightbox"
        );


    if (!lightbox) {

        return;

    }


    lightbox.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";


    updateLightbox();

}


// ============================================
// CLOSE LIGHTBOX
// ============================================

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "image-lightbox"
        );


    if (lightbox) {

        lightbox.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


// ============================================
// UPDATE LIGHTBOX
// ============================================

function updateLightbox() {

    const image =
        document.getElementById(
            "lightbox-image"
        );


    const counter =
        document.getElementById(
            "lightbox-counter"
        );


    const thumbnails =
        document.getElementById(
            "lightbox-thumbnails"
        );


    if (
        !image ||
        currentLightboxImages.length === 0
    ) {

        return;

    }


    image.src =
        currentLightboxImages[
            currentLightboxIndex
        ];


    if (counter) {

        counter.textContent =
            `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;

    }


    if (thumbnails) {

        thumbnails.innerHTML =
            currentLightboxImages.map(

                (
                    imageUrl,
                    index
                ) => `

                    <img
                        src="${escapeHTML(
                            imageUrl
                        )}"
                        class="lightbox-thumb ${
                            index ===
                            currentLightboxIndex
                                ? "active"
                                : ""
                        }"
                        onclick="window.changeLightboxImage(${index})"
                    >

                `

            ).join("");

    }

}


// ============================================
// CHANGE LIGHTBOX IMAGE
// ============================================

window.changeLightboxImage =
function (
    index
) {

    currentLightboxIndex =
        Number(index);


    updateLightbox();

};


// ============================================
// NEXT LIGHTBOX IMAGE
// ============================================

function nextLightboxImage() {

    if (
        currentLightboxImages.length <= 1
    ) {

        return;

    }


    currentLightboxIndex =
        (
            currentLightboxIndex +
            1
        )
        %
        currentLightboxImages.length;


    updateLightbox();

}


// ============================================
// PREVIOUS LIGHTBOX IMAGE
// ============================================

function previousLightboxImage() {

    if (
        currentLightboxImages.length <= 1
    ) {

        return;

    }


    currentLightboxIndex =
        (
            currentLightboxIndex -
            1 +
            currentLightboxImages.length
        )
        %
        currentLightboxImages.length;


    updateLightbox();

}


// ============================================
// NOTIFICATION
// ============================================

function showNotification(
    message
) {

    const oldNotification =
        document.querySelector(
            ".melodex-notification"
        );


    if (oldNotification) {

        oldNotification.remove();

    }


    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        "melodex-notification";


    notification.innerHTML = `

        <i
            class="fas fa-check-circle"
        ></i>

        <span>

            ${escapeHTML(
                message
            )}

        </span>

    `;


    document.body.appendChild(
        notification
    );


    setTimeout(
        () => {

            notification.classList.add(
                "show"
            );

        },

        50
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


// ============================================
// SMOOTH SCROLL
// ============================================

function initializeSmoothScroll() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",

                    function (
                        event
                    ) {

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


                        if (
                            target
                        ) {

                            event.preventDefault();


                            target.scrollIntoView({

                                behavior:
                                    "smooth"

                            });

                        }

                    }

                );

            }
        );

}


// ============================================
// INITIALIZE EVENTS
// ============================================

function initializeEvents() {

    // CART ICON

    const cartIcon =
        document.querySelector(
            ".cart-icon"
        );


    if (cartIcon) {

        cartIcon.addEventListener(
            "click",
            openCart
        );

    }


    // CART CLOSE

    const cartClose =
        document.getElementById(
            "cart-close-btn"
        );


    if (cartClose) {

        cartClose.addEventListener(
            "click",
            closeCart
        );

    }


    // CART OVERLAY

    const cartOverlay =
        document.getElementById(
            "cart-overlay"
        );


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    // CLEAR CART

    const clearButton =
        document.getElementById(
            "clear-cart-btn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearCart
        );

    }


    // CHECKOUT WHATSAPP

    const checkoutButton =
        document.getElementById(
            "checkout-whatsapp-btn"
        );


    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            checkoutWhatsApp
        );

    }


    // CONTINUE SHOPPING

    const continueButton =
        document.getElementById(
            "continue-shopping-btn"
        );


    if (continueButton) {

        continueButton.addEventListener(
            "click",

            () => {

                closeCart();


                const guitars =
                    document.getElementById(
                        "guitars"
                    );


                if (guitars) {

                    guitars.scrollIntoView({

                        behavior:
                            "smooth"

                    });

                }

            }

        );

    }


    // LIGHTBOX CLOSE

    const lightboxClose =
        document.getElementById(
            "lightbox-close"
        );


    if (lightboxClose) {

        lightboxClose.addEventListener(
            "click",
            closeLightbox
        );

    }


    // LIGHTBOX BACKDROP

    const lightboxBackdrop =
        document.getElementById(
            "lightbox-backdrop"
        );


    if (lightboxBackdrop) {

        lightboxBackdrop.addEventListener(
            "click",
            closeLightbox
        );

    }


    // NEXT IMAGE

    const nextButton =
        document.getElementById(
            "lightbox-next"
        );


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            nextLightboxImage
        );

    }


    // PREVIOUS IMAGE

    const previousButton =
        document.getElementById(
            "lightbox-prev"
        );


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            previousLightboxImage
        );

    }


    // KEYBOARD

    document.addEventListener(
        "keydown",

        event => {

            if (
                event.key === "Escape"
            ) {

                closeCart();

                closeLightbox();

            }


            const lightbox =
                document.getElementById(
                    "image-lightbox"
                );


            if (
                lightbox &&
                lightbox.classList.contains(
                    "active"
                )
            ) {

                if (
                    event.key ===
                    "ArrowRight"
                ) {

                    nextLightboxImage();

                }


                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    previousLightboxImage();

                }

            }

        }

    );

}


// ============================================
// INITIALIZE APPLICATION
// ============================================

async function initApp() {

    // LOAD CART

    loadCartFromStorage();


    // UPDATE CART

    updateCartUI();


    // EVENTS

    initializeEvents();


    // SMOOTH SCROLL

    initializeSmoothScroll();


    // FETCH PRODUCTS

    await fetchFirebaseProducts();


    // DISPLAY PRODUCTS

    displayProductsByCategory();

}


// ============================================
// START APPLICATION
// ============================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        initApp

    );

}

else {

    initApp();

}
