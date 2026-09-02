// Products Database with Real Images and Categories
const products = [
    // Guitars
    {
        id: 1,
        name: 'Luxurs SG62 Headless Electric Guitar',
        category: 'guitars',
        price: 29990,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        description: 'Premium headless electric guitar with superior sound quality and ergonomic design'
    },
    {
        id: 2,
        name: 'Yifenli Stratocaster Electric Guitar',
        category: 'guitars',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1516924962622-2b52b27e7519?w=400&h=300&fit=crop',
        description: 'Classic stratocaster design with excellent tone and versatile sound'
    },
    {
        id: 3,
        name: 'LETTU Veneer Wooden Acoustic Guitar',
        category: 'guitars',
        price: 13500,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        description: 'Beautiful wooden acoustic guitar with rich, warm resonance and perfect action'
    },
    {
        id: 4,
        name: 'Crafty Acoustic Guitar + Free Accessories',
        category: 'guitars',
        price: 4600,
        image: 'https://images.unsplash.com/photo-1559329007-40790c9c71f7?w=400&h=300&fit=crop',
        description: 'Complete beginner package with accessories, stand, and tuner included'
    },

    // Pedals & Effects
    {
        id: 5,
        name: 'Harmonize Pedal - Aroma Ahar-3',
        category: 'pedals',
        price: 5500,
        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=300&fit=crop',
        description: 'Professional harmonic pedal for rich, layered sound effects and ambience'
    },
    {
        id: 6,
        name: 'Caline CP31P Volume Pedal',
        category: 'pedals',
        price: 6500,
        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=300&fit=crop',
        description: 'Precision volume control pedal for live performance and studio use'
    },
    {
        id: 7,
        name: 'DF1511A Stereo Volume Pedal',
        category: 'pedals',
        price: 4550,
        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=300&fit=crop',
        description: 'Stereo-enabled volume pedal for advanced multi-track setup and routing'
    },
    {
        id: 8,
        name: 'Universal Sustain Pedal',
        category: 'pedals',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=300&fit=crop',
        description: 'Affordable sustain pedal for keyboard and digital instruments'
    },

    // Pedalboards & Power
    {
        id: 9,
        name: 'Electric Pedal Board - Aluminium Velcro',
        category: 'pedalboards',
        price: 4500,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: 'Durable aluminium pedalboard with strong velcro strips for secure mounting'
    },
    {
        id: 10,
        name: 'Ultra Lightweight EVA Pedal Board',
        category: 'pedalboards',
        price: 2800,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: 'Portable and lightweight pedalboard perfect for touring and gigs'
    },
    {
        id: 11,
        name: 'Irin 8-Way 9V Power Supply',
        category: 'pedalboards',
        price: 3500,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: '8-way power supply for powering multiple pedals simultaneously'
    },
    {
        id: 12,
        name: 'Ghostfire T-Series Effector Case T-EC6',
        category: 'pedalboards',
        price: 8200,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: 'Professional protective case designed for 6 pedals with padding'
    },
    {
        id: 13,
        name: 'Ghostfire T-Series Effector Case T-EC8',
        category: 'pedalboards',
        price: 11000,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: 'Professional protective case designed for 8 pedals with superior protection'
    },
    {
        id: 14,
        name: 'Rockhouse Patch Cables - 6 pcs',
        category: 'pedalboards',
        price: 1300,
        image: 'https://images.unsplash.com/photo-1556821552-5eb066afbf3f?w=400&h=300&fit=crop',
        description: 'Set of 6 high-quality patch cables for connecting pedals'
    },

    // Stands
    {
        id: 15,
        name: 'Portable Double-Layer Keyboard Stand 1.2m',
        category: 'stands',
        price: 16000,
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
        description: 'Adjustable keyboard stand with double layer support for stability'
    },
    {
        id: 16,
        name: 'Portable Double-Layer Keyboard Stand 1.4m',
        category: 'stands',
        price: 17300,
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
        description: 'Extended keyboard stand for larger instruments with sturdy base'
    },
    {
        id: 17,
        name: 'Keyboard Stand Extension',
        category: 'stands',
        price: 3000,
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
        description: 'Extra extension kit for keyboard stands to increase height'
    },
    {
        id: 18,
        name: 'Smiger Guitar Stand',
        category: 'stands',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        description: 'Sturdy guitar stand for safe storage and display of instruments'
    },
    {
        id: 19,
        name: 'Winerten Guitar Stand - Thick Model',
        category: 'stands',
        price: 3200,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        description: 'Heavy-duty guitar stand with thick design for maximum stability'
    },
    {
        id: 20,
        name: 'Winerten Guitar Stand - Foldable Model',
        category: 'stands',
        price: 2800,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
        description: 'Portable foldable guitar stand perfect for travel and storage'
    },

    // Cables & Accessories
    {
        id: 21,
        name: 'Silver Sipai Inspire Guitar Cable - Noise Reduction',
        category: 'cables',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1599043513691-9134dc9ef29f?w=400&h=300&fit=crop',
        description: 'Premium cable with noise reduction technology for clean signal transmission'
    },
    {
        id: 22,
        name: 'Yongwei Guitar/Keyboard Cable',
        category: 'cables',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1599043513691-9134dc9ef29f?w=400&h=300&fit=crop',
        description: 'Universal cable compatible with guitars and keyboards'
    },
    {
        id: 23,
        name: 'HK Guitar/Keyboard Cable - Metal Head',
        category: 'cables',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1599043513691-9134dc9ef29f?w=400&h=300&fit=crop',
        description: 'Durable cable with premium metal connectors and shielding'
    },
    {
        id: 24,
        name: 'Gold-Plated 6.35mm Mono Audio Cable',
        category: 'cables',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1599043513691-9134dc9ef29f?w=400&h=300&fit=crop',
        description: 'Premium oxygen-free copper cable with gold plating and shielding'
    }
];

let cart = [];

// Display products by category
function displayProductsByCategory() {
    const categories = ['guitars', 'pedals', 'pedalboards', 'stands', 'cables'];
    
    categories.forEach(category => {
        const container = document.getElementById(category + 'Container');
        if (container) {
            const categoryProducts = products.filter(p => p.category === category);
            container.innerHTML = '';
            
            categoryProducts.forEach(product => {
                const productHTML = `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <span class="product-category">${getCategoryName(product.category)}</span>
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-description">${product.description}</p>
                            <div class="product-price">৳ ${product.price.toLocaleString('en-BD')}</div>
                            <div class="product-actions">
                                <button class="btn-add-cart" onclick="addToCart(${product.id})">Add to Cart</button>
                                <a href="https://wa.me/8801XXXXXXXXX?text=Hi%20Melodex,%20I'm%20interested%20in%20${encodeURIComponent(product.name)}%20for%20%E0%A7%B3${product.price}" target="_blank" class="btn btn-whatsapp">
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    displayProductsByCategory();
    
    // Smooth scroll for navigation links
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