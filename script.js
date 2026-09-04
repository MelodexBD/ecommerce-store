// =========================================
// MELODEX STORE
// FIREBASE SDK + PRODUCT LOADING + CART
// =========================================


// =========================================
// FIREBASE IMPORTS
// =========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";


import {
    getFirestore,
    collection,
    getDocs,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";


// =========================================
// FIREBASE CONFIG
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
// WHATSAPP
// =========================================

const WHATSAPP_NUMBER = "8801310863206";


// =========================================
// INITIALIZE FIREBASE
// =========================================

const app =
    initializeApp(
        firebaseConfig
    );


// গুরুত্বপূর্ণ:
// initializeFirestore() ব্যবহার করা হয়নি
// কারণ আপনার browser-এ cacheSizeBytes error হচ্ছিল

const db =
    getFirestore(app);


// =========================================
// FIREBASE OFFLINE CACHE
// =========================================

enableIndexedDbPersistence(db)

    .then(() => {

        console.log(
            "Firebase offline cache enabled."
        );

    })

    .catch(error => {

        console.warn(
            "Firebase cache could not be enabled:",
            error.code
        );

    });


// =========================================
// GLOBAL VARIABLES
// =========================================

let products = [];

let cart = [];


// =========================================
// CATEGORY NORMALIZATION
// =========================================

function normalizeCategory(category) {

    if (!category) {

        return "guitars";

    }


    const cat =
        String(category)
            .toLowerCase()
            .trim();


    if (
        cat.includes("guitar")
    ) {

        return "guitars";

    }


    if (
        cat.includes("pedalboard")
    ) {

        return "pedalboards";

    }


    if (
        cat.includes("pedal")
    ) {

        return "pedals";

    }


    if (
        cat.includes("stand")
    ) {

        return "stands";

    }


    if (

        cat.includes("cable") ||

        cat.includes("accessories") ||

        cat.includes("accessory") ||

        cat.includes("accessori")

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

        guitars:
            "Guitars",

        pedals:
            "Pedals & Effects",

        pedalboards:
            "Pedalboards & Power",

        stands:
            "Stands",

        cables:
            "Cables & Accessories"

    };


    return names[category] || category;

}


// =========================================
// FETCH PRODUCTS FROM FIREBASE
// =========================================

async function fetchProducts() {

    showProductLoading();


    try {

        const querySnapshot =
            await getDocs(

                collection(
                    db,
                    "products"
                )

            );


        const firebaseProducts =
            [];


        querySnapshot.forEach(doc => {

            const data =
                doc.data();


            let imageList =
                [];


            // Multiple images

            if (

                Array.isArray(
                    data.images
                ) &&

                data.images.length > 0

            ) {

                imageList =
                    data.images.filter(
                        image => {

                            return (

                                typeof image ===
                                "string"

                                &&

                                image.trim() !==
                                ""

                            );

                        }
                    );

            }


            // Single image fallback

            if (

                imageList.length === 0 &&

                data.image

            ) {

                imageList =

                    [
                        data.image
                    ];

            }


            firebaseProducts.push({

                id:
                    doc.id,


                name:

                    data.name ||

                    "Unnamed Product",


                category:

                    normalizeCategory(
                        data.category
                    ),


                price:

                    Number(
                        data.price
                    ) || 0,


                image:

                    imageList[0] ||
                    "",


                images:

                    imageList,


                description:

                    data.description ||
                    ""

            });

        });


        // Firebase products save

        products =
            firebaseProducts;


        // Update product count

        updateProductCount();


        // Display products

        displayProductsByCategory();


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


    categories.forEach(
        category => {

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
                            grid-column: 1/-1;
                            text-align: center;
                            padding: 30px;
                            color: #94a3b8;
                        "
                    >

                        <i
                            class="fas fa-spinner fa-spin"
                            style="
                                font-size: 24px;
                                margin-bottom: 8px;
                            "
                        ></i>

                        <p>
                            Loading products...
                        </p>

                    </div>

                `;

            }

        }
    );

}


// =========================================
// SHOW LOAD ERROR
// =========================================

function showProductLoadError() {

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
                    `${category}Container`
                );


            if (

                container &&

                products.length === 0

            ) {

                container.innerHTML = `

                    <p
                        style="
                            grid-column: 1/-1;
                            text-align: center;
                            color: #ef4444;
                            padding: 20px;
                        "
                    >

                        Product load করা সম্ভব হয়নি।
                        অনুগ্রহ করে পেজটি refresh করুন।

                    </p>

                `;

            }

        }
    );

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


    categories.forEach(
        category => {


            const container =

                document.getElementById(
                    `${category}Container`
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


            if (

                categoryProducts.length === 0

            ) {

                container.innerHTML = `

                    <p
                        class="no-products"
                        style="
                            grid-column: 1/-1;
                            text-align: center;
                            padding: 20px;
                        "
                    >

                        এই ক্যাটাগরিতে কোনো
                        প্রোডাক্ট নেই।

                    </p>

                `;


                return;

            }


            let productsHTML =
                "";


            categoryProducts.forEach(

                (
                    product,
                    productIndex
                ) => {


                    let thumbnailsHTML =
                        "";


                    // ---------------------------------
                    // PRODUCT THUMBNAILS
                    // ---------------------------------

                    if (

                        product.images &&

                        product.images.length > 1

                    ) {


                        thumbnailsHTML =

                            `<div class="product-thumbnails">`;


                        product.images.forEach(

                            (
                                imageUrl,
                                index
                            ) => {


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


                    // ---------------------------------
                    // IMAGE LOADING
                    // ---------------------------------

                    const imageLoading =

                        productIndex < 4

                            ? "eager"

                            : "lazy";


                    // ---------------------------------
                    // PRODUCT CARD
                    // ---------------------------------

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

        }

    );

}


// =========================================
// PRODUCT EVENTS
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


            // ORDER PRODUCT

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
                        .forEach(
                            thumb => {

                                thumb.classList.remove(
                                    "active"
                                );

                            }
                        );


                    thumbnail.classList.add(
                        "active"
                    );

                }

            }

        }

    );

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

                ? JSON.parse(
                    savedCart
                )

                : [];


        if (

            !Array.isArray(
                cart
            )

        ) {

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

            JSON.stringify(
                cart
            )

        );

    } catch (error) {

        console.warn(
            "Cart save error:",
            error
        );

    }

}


// =========================================
// ADD TO CART
// =========================================

function addToCart(productId) {

    const product =

        products.find(
            product =>

                String(product.id) ===
                String(productId)
        );


    if (!product) {

        return;

    }


    const existingItem =

        cart.find(
            item =>

                String(item.id) ===
                String(productId)
        );


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

            (
                total,
                item
            ) =>

                total +

                Number(
                    item.quantity || 0
                ),

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


    // EMPTY CART

    if (

        cart.length === 0

    ) {


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


    let cartHTML =
        "";


    let totalPrice =
        0;


    cart.forEach(
        item => {


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

        }
    );


    cartItems.innerHTML =
        cartHTML;


    cartTotal.textContent =

        `৳ ${formatPrice(
            totalPrice
        )}`;

}


// =========================================
// CART EVENTS
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

        cart.find(
            item =>

                String(item.id) ===
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


        if (

            item.quantity <= 0

        ) {

            cart =

                cart.filter(
                    item =>

                        String(item.id) !==
                        String(productId)
                );

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

        cart.filter(
            item =>

                String(item.id) !==
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

        products.find(
            product =>

                String(product.id) ===
                String(productId)
        );


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


    let totalPrice =
        0;


    cart.forEach(

        (
            item,
            index
        ) => {


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


    setTimeout(
        () => {


            notification.classList.add(
                "hide"
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


    // SMOOTH SCROLL

    document
        .querySelectorAll(
            'a[href^="#"]'
        )

        .forEach(
            link => {

                link.addEventListener(

                    "click",

                    function(event) {


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

            }

        );

}


// =========================================
// INITIALIZE APPLICATION
// =========================================

function initApp() {


    // ---------------------------------
    // CART LOAD
    // ---------------------------------

    loadCart();

    updateCart();


    // ---------------------------------
    // EVENTS
    // ---------------------------------

    initializeEvents();

    initializeProductEvents();

    initializeCartEvents();


    // ---------------------------------
    // FIREBASE PRODUCT LOAD
    // ---------------------------------

    fetchProducts();

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
