// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initializeFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

// মোবাইল ব্রাউজার ও মেসেঞ্জারের জন্য Long Polling সাপোর্ট
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
});

let products = [];
let cart = [];

// সব ধরনের বানান ও স্পেস সামঞ্জস্য করার জন্য নিখুঁত ক্যাটাগরি চেকার
function normalizeCategory(cat) {
    if (!cat) return 'guitars';
    const c = String(cat).toLowerCase().replace(/[^a-z]/g, '');
    
    if (c.includes('guitar')) return 'guitars';
    if (c.includes('pedalboard')) return 'pedalboards';
    if (c.includes('pedal')) return 'pedals';
    if (c.includes('stand')) return 'stands';
    if (c.includes('cable') || c.includes('accessori')) return 'cables';
    return 'guitars';
}

// Fetch products from Firebase Firestore
async function fetchFirebaseProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fbProducts = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let imgList = [];
            if (Array.isArray(data.images) && data.images.length > 0) {
                imgList = data.images;
            } else if (data.image) {
                imgList = [data.image];
            }

            fbProducts.push({
                id: doc.id,
                name: data.name || 'Unnamed Product',
                category: normalizeCategory(data.category),
                price: Number(data.price) || 0,
                image: imgList[0] || '',
                images: imgList,
                description: data.description || ''
            });
        });

        products = fbProducts;

        // Update live product count in About section
        const countEl = document.getElementById('total-products-count');
        if (countEl) {
            countEl.textContent = products.length > 0 ? `${products.length}+` : '0';
        }
    } catch (error) {
        console.error("Firebase fetch error:", error);
    }
}

// Global Image switcher function
window.changeProductImage = function(productId, newUrl, thumbElement) {
    const mainImg = document.getElementById(`main-img-${productId}`);
    if (mainImg) {
        mainImg.src = newUrl;
    }
    const parent = thumbElement.parentElement;
    if (parent) {
        parent.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
        thumbElement.classList.add('active');
    }
};

// Display products by category
function displayProductsByCategory() {
    const categories = ['guitars', 'pedals', 'pedalboards', 'stands', 'cables'];
    
    categories.forEach(category => {
        const container = document.getElementById(category + 'Container');
        if (container) {
            const categoryProducts = products.filter(p => p.category === category);
            container.innerHTML = ''; // আগের স্কেলিটন বা লোডার মুছে ফেলবে
            
            if (categoryProducts.length === 0) {
                container.innerHTML = '<p style="color: #94a3b8; font-size: 14px; grid-column: 1/-1; text-align: center; padding: 20px;">এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট যুক্ত করা হয়নি।</p>';
                return;
            }
            
            categoryProducts.forEach(product => {
                let thumbsHTML = '';
                if (product.images && product.images.length > 1) {
                    thumbsHTML = '<div class="product-thumbnails">';
                    product.images.forEach((imgUrl, index) => {
                        thumbsHTML += `
                            <img src="${imgUrl}" 
                                 class="thumb-img ${index === 0 ? 'active' : ''}" 
                                 onclick="window.changeProductImage('${product.id}', '${imgUrl}', this)" 
                                 alt="thumb">
                        `;
                    });
                    thumbsHTML += '</div>';
                }

                const productHTML = `
                    <div class="product-card" id="card-${product.id}">
                        <img src="${product.image}" alt="${product.name}" class="product-image" id="main-img-${product.id}">
                        ${thumbsHTML}
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

// App execution
async function initApp() {
    await fetchFirebaseProducts();
    displayProductsByCategory();
    
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Ensure execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Cart Logic
window.addToCart = function(productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
        cart.push(product);
        updateCartCount();
        showNotification(`${product.name} added to cart!`);
    }
};

function updateCartCount() {
    const cartEl = document.querySelector('.cart-count');
    if (cartEl) {
        cartEl.textContent = cart.length;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3B82F6, #60A5FA);
        color: white;
        padding: 1.2rem 1.8rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        font-weight: 600;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

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
