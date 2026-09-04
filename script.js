// =========================================
// MELODEX STORE
// ULTRA FAST PRODUCT LOADING + CACHE SYSTEM
// =========================================


// =========================================
// FIREBASE CONFIG
// =========================================

const FIREBASE_PROJECT_ID = "melodex-store";

const FIREBASE_API_KEY = "AIzaSyBTVoMKlJeRWsgIL5gCdWCHYdx3w8brWHQ";

const WHATSAPP_NUMBER = "8801310863206";


// =========================================
// CACHE SETTINGS
// =========================================

const PRODUCT_CACHE_KEY = "melodexProductsCacheV4";

const PRODUCT_CACHE_TIME_KEY = "melodexProductsCacheTimeV4";


// Cache থাকবে সর্বোচ্চ 7 দিন
// তবে প্রতিবার background-এ Firebase থেকে update check হবে

const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;


// =========================================
// GLOBAL VARIABLES
// =========================================

let products = [];

let cart = [];

let productsAreLoading = false;

let firebaseLoadFailed = false;


// =========================================
// FIRESTORE REST API URL
// =========================================

const FIRESTORE_PRODUCTS_URL =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/products?key=${FIREBASE_API_KEY}&pageSize=100`;


// =========================================
// CATEGORY NORMALIZATION
// =========================================

function normalizeCategory(category) {

    if (!category) {

        return "guitars";

    }


    const cat = String(category)
        .toLowerCase()
        .trim();


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


    if (
        cat.includes("cable") ||
        cat.includes("accessories") ||
        cat.includes("accessory")
    ) {

        return "cables";

    }


    return cat;

}


// =========================================
// CATEGORY NAME
// =========================================

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
// FIRESTORE VALUE CONVERTER
// =========================================

function firestoreValueToJS(value) {

    if (!value) {

        return null;

    }


    if ("stringValue" in value) {

        return value.stringValue;

    }


    if ("integerValue" in value) {

        return Number(value.integerValue);

    }


    if ("doubleValue" in value) {

        return Number(value.doubleValue);

    }


    if ("booleanValue" in value) {

        return value.booleanValue;

    }


    if ("nullValue" in value) {

        return null;

    }


    if ("arrayValue" in value) {

        const values = value.arrayValue.values || [];

        return values.map(item => firestoreValueToJS(item));

    }


    if ("mapValue" in value) {

        const result = {};

        const fields = value.mapValue.fields || {};


        Object.keys(fields).forEach(key => {

            result[key] =
                firestoreValueToJS(fields[key]);

        });


        return result;

    }


    if ("timestampValue" in value) {

        return value.timestampValue;

    }


    return null;

}


// =========================================
// CONVERT FIRESTORE DOCUMENT
// =========================================

function convertFirestoreDocument(document) {

    const fields =
        document.fields || {};


    const data = {};


    Object.keys(fields).forEach(key => {

        data[key] =
            firestoreValueToJS(fields[key]);

    });


    let imageList = [];


    if (
        Array.isArray(data.images) &&
        data.images.length > 0
    ) {

        imageList =
            data.images.filter(image => {

                return (
                    typeof image === "string" &&
                    image.trim() !== ""
                );

            });

    }


    if (
        imageList.length === 0 &&
        data.image
    ) {

        imageList = [data.image];

    }


    const documentPath =
        document.name || "";


    const documentId =
        documentPath.split("/").pop();


    return {

        id: documentId,

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
            imageList[0] || "",

        images:
            imageList,

        description:
            data.description || ""

    };

}


// =========================================
// LOAD PRODUCTS FROM CACHE
// =========================================

function loadProductsFromCache() {

    try {

        const savedProducts =
            localStorage.getItem(
                PRODUCT_CACHE_KEY
            );


        const savedTime =
            localStorage.getItem(
                PRODUCT_CACHE_TIME_KEY
            );


        if (!savedProducts) {

            return [];

        }


        const parsedProducts =
            JSON.parse(savedProducts);


        if (
            !Array.isArray(parsedProducts)
        ) {

            return [];

        }


        // Cache খুব পুরনো হলে
        // তবুও fallback হিসেবে রাখা হচ্ছে

        if (savedTime) {

            const cacheAge =
                Date.now() -
                Number(savedTime);


            if (
                cacheAge >
                CACHE_MAX_AGE
            ) {

                console.log(
                    "Melodex cache is old. Firebase will refresh it."
                );

            }

        }


        return parsedProducts;

    } catch (error) {

        console.error(
            "Product cache load error:",
            error
        );


        return [];

    }

}


// =========================================
// SAVE PRODUCTS TO CACHE
// =========================================

function saveProductsToCache(productList) {

    try {

        localStorage.setItem(

            PRODUCT_CACHE_KEY,

            JSON.stringify(
                productList
            )

        );


        localStorage.setItem(

            PRODUCT_CACHE_TIME_KEY,

            Date.now().toString()

        );


    } catch (error) {

        console.error(
            "Product cache save error:",
            error
        );

    }

}


// =========================================
// LOAD CART
// =========================================

function loadCart() {

    try {

        const savedCart =
            localStorage.getItem(
                "melodexCart"
            );


        cart =
            savedCart
                ? JSON.parse(savedCart)
                : [];


        if (!Array.isArray(cart)) {

            cart = [];

        }


    } catch (error) {

        console.error(
            "Cart load error:",
            error
        );


        cart = [];

    }

}


// =========================================
// SAVE CART
// =========================================

function saveCart() {

    try {

        localStorage.setItem(

            "melodexCart",

            JSON.stringify(cart)

        );


    } catch (error) {

        console.error(
            "Cart save error:",
            error
        );

    }

}


// =========================================
// FAST FIRESTORE PRODUCT FETCH
// =========================================

async function fetchFirebaseProducts() {

    productsAreLoading = true;

    firebaseLoadFailed = false;


    try {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(() => {

                controller.abort();

            }, 15000);


        const response =
            await fetch(

                FIRESTORE_PRODUCTS_URL,

                {

                    method: "GET",

                    signal:
                        controller.signal,

                    cache:
                        "no-store"

                }

            );


        clearTimeout(timeout);


        if (!response.ok) {

            throw new Error(

                `Firebase request failed: ${response.status}`

            );

        }


        const result =
            await response.json();


        const documents =
            result.documents || [];


        const firebaseProducts =
            documents.map(document => {

                return convertFirestoreDocument(
                    document
                );

            });


        // নতুন Firebase product পাওয়া গেলে
        // সেটাই ব্যবহার হবে

        products =
            firebaseProducts;


        // Browser Cache Update

        saveProductsToCache(
            products
        );


        // Product UI Update

        updateProductCount();

        displayProductsByCategory();


        console.log(

            `Melodex: ${products.length} products loaded from Firebase.`

        );


    } catch (error) {

        console.error(

            "Firebase product fetch failed:",

            error

        );


        firebaseLoadFailed = true;


        // Firebase fail হলেও
        // Cached product থাকলে সেটাই থাকবে

        if (
            products.length === 0
        ) {

            showProductLoadError();

        }

    } finally {

        productsAreLoading = false;

    }

}


// =========================================
// PRODUCT COUNT
// =========================================

function updateProductCount() {

    const countElement =
        document.getElementById(
            "total-products-count"
        );


    if (!countElement) {

        return;

    }


    countElement.textContent =
        products.length > 0
            ? `${products.length}+`
            : "0";

}


// =========================================
// SHOW PRODUCT LOADING
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


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div class="product-loading">

                <div class="product-loader-spinner"></div>

                <span>
                    Loading products...
                </span>

            </div>

        `;

    });

}


// =========================================
// SHOW PRODUCT LOAD ERROR
// =========================================

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


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div class="product-loading">

                <span>

                    Unable to load products.
                    Please refresh the page.

                </span>

            </div>

        `;

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


        if (!container) {

            return;

        }


        const categoryProducts =
            products.filter(product => {

                return (
                    product.category ===
                    category
                );

            });


        container.innerHTML = "";


        if (
            categoryProducts.length === 0
        ) {

            container.innerHTML = `

                <p class="no-products">

                    No products available in this category yet.

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

                        (imageUrl, index) => {

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

                        }

                    );


                    thumbnailsHTML +=
                        `</div>`;

                }


                // প্রথম কয়েকটি product image priority পাবে

                const imageLoading =
                    productIndex < 4
                        ? "eager"
                        : "lazy";


                const fetchPriority =
                    productIndex < 2
                        ? "high"
                        : "auto";


                productsHTML += `

                    <div class="product-card">


                        <div class="product-image-wrapper">


                            <img

                                src="${escapeHTML(product.image)}"

                                alt="${escapeHTML(product.name)}"

                                class="product-image"

                                id="main-img-${escapeHTML(product.id)}"

                                data-product-id="${escapeHTML(product.id)}"

                                loading="${imageLoading}"

                                fetchpriority="${fetchPriority}"

                                decoding="async"

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


                            <h3 class="product-name">

                                ${escapeHTML(
                                    product.name
                                )}

                            </h3>


                            <p class="product-description">

                                ${escapeHTML(
                                    product.description
                                )}

                            </p>


                            <div class="product-price">

                                ৳ ${formatPrice(
                                    product.price
                                )}

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


        container.innerHTML =
            productsHTML;

    });

}


// =========================================
// PRODUCT EVENT DELEGATION
// =========================================

function initializeProductEvents() {

    document.addEventListener(

        "click",

        event => {


            // ADD TO CART

            const cartButton =
                event.target.closest(
                    ".btn-add-cart"
                );


            if (cartButton) {

                addToCart(

                    cartButton.dataset
                        .productId

                );


                return;

            }


            // ORDER SINGLE PRODUCT

            const orderButton =
                event.target.closest(
                    "[data-order-product]"
                );


            if (orderButton) {

                orderSingleProduct(

                    orderButton.dataset
                        .orderProduct

                );


                return;

            }


            // IMAGE ZOOM BUTTON

            const zoomButton =
                event.target.closest(
                    ".image-zoom-btn"
                );


            if (zoomButton) {

                const mainImage =
                    document.getElementById(

                        `main-img-${zoomButton.dataset.productId}`

                    );


                if (mainImage) {

                    openImageModal(

                        mainImage.src,

                        mainImage.alt

                    );

                }


                return;

            }


            // MAIN PRODUCT IMAGE

            const productImage =
                event.target.closest(
                    ".product-image"
                );


            if (productImage) {

                openImageModal(

                    productImage.src,

                    productImage.alt

                );


                return;

            }


            // THUMBNAIL

            const thumbnail =
                event.target.closest(
                    ".thumb-img"
                );


            if (thumbnail) {

                const productId =
                    thumbnail.dataset
                        .productId;


                const imageURL =
                    thumbnail.dataset
                        .image;


                const mainImage =
                    document.getElementById(

                        `main-img-${productId}`

                    );


                if (mainImage) {

                    mainImage.src =
                        imageURL;

                }


                const parent =
                    thumbnail.parentElement;


                if (parent) {

                    parent
                        .querySelectorAll(
                            ".thumb-img"
                        )
                        .forEach(thumb => {

                            thumb.classList.remove(
                                "active"
                            );

                        });


                    thumbnail.classList.add(
                        "active"
                    );

                }


                return;

            }

        }

    );

}


// =========================================
// ADD TO CART
// =========================================

function addToCart(productId) {

    const product =
        products.find(product => {

            return (
                String(product.id) ===
                String(productId)
            );

        });


    if (!product) {

        return;

    }


    const existingItem =
        cart.find(item => {

            return (
                String(item.id) ===
                String(productId)
            );

        });


    if (existingItem) {

        existingItem.quantity += 1;

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


// =========================================
// UPDATE CART
// =========================================

function updateCart() {

    updateCartCount();

    renderCart();

}


// =========================================
// CART COUNT
// =========================================

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

            (total, item) => {

                return (

                    total +
                    Number(
                        item.quantity || 0
                    )

                );

            },

            0

        );


    cartCount.textContent =
        totalQuantity;

}


// =========================================
// RENDER CART
// =========================================

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


    if (
        cart.length === 0
    ) {

        cartItems.innerHTML = "";


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


    cart.forEach(item => {

        const itemTotal =

            Number(item.price) *

            Number(item.quantity);


        cartHTML += `

            <div class="cart-item">


                <img

                    src="${escapeHTML(item.image)}"

                    alt="${escapeHTML(item.name)}"

                    class="cart-item-image"

                >


                <div class="cart-item-info">


                    <h4>

                        ${escapeHTML(
                            item.name
                        )}

                    </h4>


                    <span class="cart-item-price">

                        ৳ ${formatPrice(
                            item.price
                        )}

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

                        ৳ ${formatPrice(
                            itemTotal
                        )}

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


    const totalPrice =
        cart.reduce(

            (total, item) => {

                return (

                    total +

                    (
                        Number(item.price) *

                        Number(item.quantity)
                    )

                );

            },

            0

        );


    cartTotal.textContent =

        `৳ ${formatPrice(
            totalPrice
        )}`;

}


// =========================================
// CART ITEM EVENT DELEGATION
// =========================================

function initializeCartEvents() {

    document.addEventListener(

        "click",

        event => {


            const quantityButton =
                event.target.closest(
                    "[data-cart-action]"
                );


            if (quantityButton) {

                changeCartQuantity(

                    quantityButton.dataset
                        .productId,

                    quantityButton.dataset
                        .cartAction

                );


                return;

            }


            const removeButton =
                event.target.closest(
                    ".remove-cart-item"
                );


            if (removeButton) {

                removeCartItem(

                    removeButton.dataset
                        .productId

                );

            }

        }

    );

}


// =========================================
// CHANGE CART QUANTITY
// =========================================

function changeCartQuantity(

    productId,

    action

) {

    const item =
        cart.find(item => {

            return (

                String(item.id) ===
                String(productId)

            );

        });


    if (!item) {

        return;

    }


    if (
        action === "increase"
    ) {

        item.quantity += 1;

    }


    if (
        action === "decrease"
    ) {

        item.quantity -= 1;


        if (
            item.quantity <= 0
        ) {

            cart =
                cart.filter(item => {

                    return (

                        String(item.id) !==
                        String(productId)

                    );

                });

        }

    }


    saveCart();

    updateCart();

}


// =========================================
// REMOVE CART ITEM
// =========================================

function removeCartItem(productId) {

    cart =
        cart.filter(item => {

            return (

                String(item.id) !==
                String(productId)

            );

        });


    saveCart();

    updateCart();


    showNotification(

        "Product removed from cart.",

        "success"

    );

}


// =========================================
// OPEN CART
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


// =========================================
// CLOSE CART
// =========================================

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
// ORDER SINGLE PRODUCT
// =========================================

function orderSingleProduct(productId) {

    const product =
        products.find(product => {

            return (

                String(product.id) ===
                String(productId)

            );

        });


    if (!product) {

        return;

    }


    const message =

        `Hello Melodex! 👋

I want to order:

Product: ${product.name}
Price: ৳ ${formatPrice(product.price)}

Please let me know about availability and delivery.`;


    const whatsappURL =

        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


    window.open(

        whatsappURL,

        "_blank"

    );

}


// =========================================
// CHECKOUT CART
// =========================================

function checkoutCart() {

    if (
        cart.length === 0
    ) {

        showNotification(

            "Your cart is empty.",

            "error"

        );


        return;

    }


    let message =

        "Hello Melodex! 👋\n\nI want to order these products:\n\n";


    let totalPrice = 0;


    cart.forEach(

        (item, index) => {

            const subtotal =

                Number(item.price) *

                Number(item.quantity);


            totalPrice +=
                subtotal;


            message +=

                `${index + 1}. ${item.name}
Quantity: ${item.quantity}
Price: ৳ ${formatPrice(item.price)}
Subtotal: ৳ ${formatPrice(subtotal)}

`;

        }

    );


    message +=

        `Total Amount: ৳ ${formatPrice(totalPrice)}

Please confirm availability and delivery details.`;


    const whatsappURL =

        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;


    window.open(

        whatsappURL,

        "_blank"

    );

}


// =========================================
// OPEN IMAGE MODAL
// =========================================

function openImageModal(

    imageURL,

    altText

) {

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


    modalImage.src =
        imageURL;


    modalImage.alt =
        altText ||
        "Product Image";


    modal.classList.add(
        "active"
    );


    updateBodyScrollLock();

}


// =========================================
// CLOSE IMAGE MODAL
// =========================================

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
// FIX BODY SCROLL LOCK
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


    const modalIsOpen =

        imageModal &&
        imageModal.classList.contains(
            "active"
        );


    const cartIsOpen =

        cartSidebar &&
        cartSidebar.classList.contains(
            "active"
        );


    if (
        modalIsOpen ||
        cartIsOpen
    ) {

        document.body.style.overflow =
            "hidden";

    } else {

        document.body.style.overflow =
            "";

    }

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


    const notification =
        document.createElement(
            "div"
        );


    notification.className =

        `notification ${type}`;


    notification.textContent =
        message;


    container.appendChild(
        notification
    );


    setTimeout(() => {

        notification.classList.add(
            "hide"
        );


        setTimeout(() => {

            notification.remove();

        }, 300);


    }, 2500);

}


// =========================================
// FORMAT PRICE
// =========================================

function formatPrice(price) {

    return Number(

        price || 0

    ).toLocaleString(
        "en-BD"
    );

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHTML(value) {

    if (

        value === null ||
        value === undefined

    ) {

        return "";

    }


    return String(value)

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


    const imageModal =
        document.getElementById(
            "imageModal"
        );


    const imageModalClose =
        document.getElementById(
            "imageModalClose"
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

            }

        }

    );

}


// =========================================
// SMOOTH SCROLL
// =========================================

function initializeSmoothScroll() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )

        .forEach(link => {

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


                        target.scrollIntoView({

                            behavior:
                                "smooth",

                            block:
                                "start"

                        });

                    }

                }

            );

        });

}


// =========================================
// INITIALIZE APPLICATION
// =========================================

function initApp() {

    // ---------------------------------
    // 1. CART LOAD IMMEDIATELY
    // ---------------------------------

    loadCart();

    updateCart();


    // ---------------------------------
    // 2. ALL EVENTS
    // ---------------------------------

    initializeEvents();

    initializeProductEvents();

    initializeCartEvents();

    initializeSmoothScroll();


    // ---------------------------------
    // 3. LOAD CACHE INSTANTLY
    // ---------------------------------

    const cachedProducts =
        loadProductsFromCache();


    if (
        cachedProducts.length > 0
    ) {

        // Cache থেকে সাথে সাথে
        // Product দেখাবে

        products =
            cachedProducts;


        updateProductCount();

        displayProductsByCategory();


        console.log(

            `Melodex: ${products.length} products loaded instantly from cache.`

        );


    } else {

        // প্রথমবার visitor হলে

        // সুন্দর loading দেখাবে

        showProductLoading();

    }


    // ---------------------------------
    // 4. FIREBASE BACKGROUND SYNC
    // ---------------------------------

    // এখানে await ব্যবহার করা হয়নি

    // তাই UI Firebase-এর জন্য
    // অপেক্ষা করবে না

    fetchFirebaseProducts();

}


// =========================================
// START APPLICATION
// =========================================

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
