// Products Database with Categories
const products = [
    // Guitars
    {
        id: 1,
        name: 'Luxurs SG62 Headless Electric Guitar',
        category: 'guitars',
        price: 29990,
        icon: '🎸',
        description: 'Premium headless electric guitar with superior sound quality'
    },
    {
        id: 2,
        name: 'Yifenli Stratocaster Electric Guitar',
        category: 'guitars',
        price: 15000,
        icon: '🎸',
        description: 'Classic stratocaster design with excellent tone'
    },
    {
        id: 3,
        name: 'LETTU Veneer Wooden Acoustic Guitar',
        category: 'guitars',
        price: 13500,
        icon: '🎸',
        description: 'Beautiful wooden acoustic guitar with rich sound'
    },
    {
        id: 4,
        name: 'Crafty Acoustic Guitar + Free Accessories',
        category: 'guitars',
        price: 4600,
        icon: '🎸',
        description: 'Complete beginner package with accessories included'
    },

    // Pedals & Effects
    {
        id: 5,
        name: 'Harmonize Pedal - Aroma Ahar-3',
        category: 'pedals',
        price: 5500,
        icon: '🎛️',
        description: 'Professional harmonic pedal for rich sound effects'
    },
    {
        id: 6,
        name: 'Caline CP31P Volume Pedal',
        category: 'pedals',
        price: 6500,
        icon: '🎛️',
        description: 'Precision volume control pedal for live performance'
    },
    {
        id: 7,
        name: 'DF1511A Stereo Volume Pedal',
        category: 'pedals',
        price: 4550,
        icon: '🎛️',
        description: 'Stereo-enabled volume pedal for advanced setup'
    },
    {
        id: 8,
        name: 'Universal Sustain Pedal',
        category: 'pedals',
        price: 1500,
        icon: '🎛️',
        description: 'Affordable sustain pedal for keyboard instruments'
    },

    // Pedalboards & Power
    {
        id: 9,
        name: 'Electric Pedal Board - Aluminium Velcro',
        category: 'pedalboards',
        price: 4500,
        icon: '🔌',
        description: 'Durable aluminium pedalboard with velcro strips'
    },
    {
        id: 10,
        name: 'Ultra Lightweight EVA Pedal Board',
        category: 'pedalboards',
        price: 2800,
        icon: '🔌',
        description: 'Portable and lightweight pedalboard for gigging'
    },
    {
        id: 11,
        name: 'Irin 8-Way 9V Power Supply',
        category: 'pedalboards',
        price: 3500,
        icon: '🔌',
        description: '8-way power supply for multiple pedals'
    },
    {
        id: 12,
        name: 'Ghostfire T-Series Effector Case T-EC6',
        category: 'pedalboards',
        price: 8200,
        icon: '🔌',
        description: 'Professional protective case for 6 pedals'
    },
    {
        id: 13,
        name: 'Ghostfire T-Series Effector Case T-EC8',
        category: 'pedalboards',
        price: 11000,
        icon: '🔌',
        description: 'Professional protective case for 8 pedals'
    },
    {
        id: 14,
        name: 'Rockhouse Patch Cables - 6 pcs',
        category: 'pedalboards',
        price: 1300,
        icon: '🔌',
        description: 'Set of 6 high-quality patch cables'
    },

    // Stands
    {
        id: 15,
        name: 'Portable Double-Layer Keyboard Stand 1.2m',
        category: 'stands',
        price: 16000,
        icon: '🎹',
        description: 'Adjustable keyboard stand with double layer support'
    },
    {
        id: 16,
        name: 'Portable Double-Layer Keyboard Stand 1.4m',
        category: 'stands',
        price: 17300,
        icon: '🎹',
        description: 'Extended keyboard stand for larger instruments'
    },
    {
        id: 17,
        name: 'Keyboard Stand Extension',
        category: 'stands',
        price: 3000,
        icon: '🎹',
        description: 'Extra extension for keyboard stands'
    },
    {
        id: 18,
        name: 'Smiger Guitar Stand',
        category: 'stands',
        price: 2500,
        icon: '🎸',
        description: 'Sturdy guitar stand for safe storage'
    },
    {
        id: 19,
        name: 'Winerten Guitar Stand - Thick Model',
        category: 'stands',
        price: 3200,
        icon: '🎸',
        description: 'Heavy-duty guitar stand with thick design'
    },
    {
        id: 20,
        name: 'Winerten Guitar Stand - Foldable Model',
        category: 'stands',
        price: 2800,
        icon: '🎸',
        description: 'Portable foldable guitar stand'
    },

    // Cables & Accessories
    {
        id: 21,
        name: 'Silver Sipai Inspire Guitar Cable - Noise Reduction',
        category: 'cables',
        price: 1800,
        icon: '🔌',
        description: 'Premium cable with noise reduction technology'
    },
    {
        id: 22,
        name: 'Yongwei Guitar/Keyboard Cable',
        category: 'cables',
        price: 1200,
        icon: '🔌',
        description: 'Universal cable for guitars and keyboards'
    },
    {
        id: 23,
        name: 'HK Guitar/Keyboard Cable - Metal Head',
        category: 'cables',
        price: 1500,
        icon: '🔌',
        description: 'Durable cable with metal connectors'
    },
    {
        id: 24,
        name: 'Gold-Plated 6.35mm Mono Audio Cable',
        category: 'cables',
        price: 2000,
        icon: '🔌',
        description: 'Premium oxygen-free copper cable with shielding'
    }
];

let cart = [];
let currentCategory = 'all';

// Display Products
function displayProducts(filter = 'all') {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

    filteredProducts.forEach(product => {
        const productHTML = `
            <div class="product-card">
                <div class="product-image">${product.icon}</div>
                <div class="product-info">
                    <span class="product-category">${getCategoryName(product.category)}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">৳${product.price.toLocaleString('en-BD')}</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})">Add to Cart</button>
                        <a href="https://wa.me/8801XXXXXXXXX?text=Hi%20Melodex,%20I'm%20interested%20in%20${encodeURIComponent(product.name)}%20for%20৳${product.price}" target="_blank" class="btn btn-whatsapp">
                            <i class="fab fa-whatsapp"></i> Order Now
                        </a>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

// Category Click Handler
document.addEventListener('DOMContentLoaded', function() {
    displayProducts();

    // Category Filter
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            currentCategory = category;
            displayProducts(category);
            
            // Highlight active category
            document.querySelectorAll('.category-card').forEach(c => {
                c.style.backgroundColor = '';
                c.style.color = '';
            });
            this.style.backgroundColor = 'var(--primary-color)';
            this.style.color = 'var(--white)';
        });
    });

    // Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCartCount();
    showNotification(`${product.name} added to cart!`);
}

// Update Cart Count
function updateCartCount() {
    document.querySelector('.cart-count').textContent = cart.length;
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        font-weight: 600;
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

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});