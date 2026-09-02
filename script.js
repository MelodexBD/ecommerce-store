// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Firebase configuration
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
const db = getFirestore(app);

let products = [];
window.cart = [];

// Normalize category matching
function normalizeCategory(cat) {
    if (!cat) return 'guitars';
    const c = cat.toLowerCase();
    if (c.includes('guitar')) return 'guitars';
    if (c.includes('pedalboard')) return 'pedalboards';
    if (c.includes('pedal')) return 'pedals';
    if (c.includes('stand')) return 'stands';
    if (c.includes('cable') || c.includes('accessories')) return 'cables';
    return c;
}

// Fetch products from Firebase Firestore
async function fetchFirebaseProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fbProducts = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const imgs = data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : []);
            fbProducts.push({
                id: doc.id,
                name: data.name,
                category: normalizeCategory(data.category),
                price: Number(data.price),
                image: imgs[0] || '',
                images: imgs,
                description: data.description || ''
            });
        });

        products = fbProducts;

        // Auto update product counter in About section
        const countEl = document.getElementById('totalProductsCount');
        if (countEl) {
            countEl.textContent = products.length > 0 ? `${products.length}+` : '0';
        }
    } catch (error) {
        console.error("Firebase fetch failed:", error);
    }
}

// Display products by category
function displayProductsByCategory() {
    const categories = ['guitars', 'pedals', 'pedalboards', 'stands', 'cables'];
    
    categories.forEach(category => {
        const container = document.getElementById(category + 'Container');
        if (container) {
            const categoryProducts = products.filter(p => p.category === category);
            container.innerHTML = '';
            
            if (categoryProducts.length === 0) {
                container.innerHTML = '<p style="color: #94a3b8; font-size: 14px; grid-column: 1/-1; text-align: center; padding: 25px;">No products have been added to this category yet.</p>';
                return;
            }
            
            categoryProducts.forEach(product => {
                // Generate gallery thumbnails if multiple images exist
                let thumbsHtml = '';
                if (product.images && product.images.length > 1) {
                    thumbsHtml = '<div class="product-gallery-thumbs" style="display: flex; gap: 8px; margin: 10px 0; justify-content: center; flex-wrap: wrap;">';
                    product.images.forEach((imgUrl) => {
                        thumbsHtml += `
                            <img src="${imgUrl}" 
                                 onclick="switchProductImage('${product.id}', '${imgUrl}')" 
                                 style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #29292e; cursor: pointer; transition: 0.2s;"
                                 onmouseover="this.style.borderColor='#e50914'"
                                 onmouseout="this.style.borderColor='#29292e'"
                                 alt="">
                        `;
                    });
                    thumbsHtml += '</div>';
                }

                const productHTML = `
                    <div class="product-card">
                        <img src="${product.image}" id="main-img-${product.id}" alt="${product.name}" class="product-image">
                        ${thumbsHtml}
                        <div class="product-info">
                            <span class="product-category">${getCategoryName(product.category)}</span>
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-description">${product.description}</p>
                            <div class="product-price">৳ ${product.price.toLocaleString('en-BD')}</div>
                            <div class="product-actions">
                                <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add to Cart</button>
                                <a href="https://wa.me/+8801310863206?text=Hi%20Melodex,%20I'm%20interested%20in%20${encodeURIComponent(product.name)}%20for%20%E0%A7%B3${product.price}" target="_blank" class="btn btn-whatsapp">
                                    <i class="fab fa-whatsapp"></i> Order Now
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += productHTML;
            });
        }
    });
}

// Function to switch main image on thumbnail click
window.switchProductImage = function(productId, targetSrc) {
    const mainImg = document.getElementById(`main-img-${productId}`);
    if (mainImg) {
        mainImg.src = targetSrc;
    }
};

// Add to Cart
window.addToCart = function(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
        window.cart.push(product);
        updateCartCount();
        showNotification(`${product.name} added to cart!`);
    }
};

// Update Cart Count
function updateCartCount() {
    const cartEl = document.querySelector('.cart-count');
    if (cartEl) {
        cartEl.textContent = window.cart.length;
    }
}

// Notification Popup
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e50914;
        color: white;
        padding: 1rem 1.6rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 700;
        box-shadow: 0 10px 25px rgba(229, 9, 20, 0.4);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Category Names
function getCategoryName(category) {
    const names = {
        'guitars': 'Guitars',
        'pedals': 'Pedals & Effects',
        'pedalboards': 'Pedalboards',
        'stands': 'Stands',
        'cables': 'Cables & Accessories'
    };
    return names[category] || category;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await fetchFirebaseProducts();
    displayProductsByCategory();
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
