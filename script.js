// পণ্যের ডেটা
const products = [
    {
        id: 1,
        name: 'স্মার্ট ফোন প্রো',
        category: 'electronics',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=300&fit=crop',
        description: 'সর্বশেষ প্রযুক্তির স্মার্ট ফোন'
    },
    {
        id: 2,
        name: 'ওয়্যারলেস ইয়ারবাড',
        category: 'electronics',
        price: 8000,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        description: 'নয়েজ ক্যান্সেলিং সহ ইয়ারবাড'
    },
    {
        id: 3,
        name: 'ফ্যাশন টি-শার্ট',
        category: 'fashion',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        description: 'আরামদায়ক এবং স্টাইলিশ টি-শার্ট'
    },
    {
        id: 4,
        name: 'প্রিমিয়াম জিনস',
        category: 'fashion',
        price: 3500,
        image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=400&h=300&fit=crop',
        description: 'উচ্চমানের ডেনিম জিনস'
    },
    {
        id: 5,
        name: 'স্কিন কেয়ার সিরাম',
        category: 'beauty',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop',
        description: 'প্রাকৃতিক উপাদান দিয়ে তৈরি সিরাম'
    },
    {
        id: 6,
        name: 'লিপস্টিক কালেকশন',
        category: 'beauty',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop',
        description: 'বিভিন্ন রং এর লিপস্টিক'
    },
    {
        id: 7,
        name: 'টেবিল ল্যাম্প',
        category: 'home',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1565636192335-14c46fa1120d?w=400&h=300&fit=crop',
        description: 'আধুনিক ডিজাইনের টেবিল ল্যাম্প'
    },
    {
        id: 8,
        name: 'কুশন কভার সেট',
        category: 'home',
        price: 3000,
        image: 'https://images.unsplash.com/photo-1558062407-d051d5f2b004?w=400&h=300&fit=crop',
        description: 'রঙিন এবং আরামদায়ক কুশন কভার'
    },
    {
        id: 9,
        name: 'স্মার্ট ওয়াচ',
        category: 'electronics',
        price: 12000,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
        description: 'ফিটনেস ট্র্যাকিং সহ স্মার্ট ওয়াচ'
    },
    {
        id: 10,
        name: 'ক্যাজুয়াল শার্ট',
        category: 'fashion',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1596527567522-09e6e341e398?w=400&h=300&fit=crop',
        description: 'পরিশোধিত ক্যাজুয়াল শার্ট'
    },
    {
        id: 11,
        name: 'ফেস মাস্ক',
        category: 'beauty',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop',
        description: 'প্রাকৃতিক উপাদানের ফেস মাস্ক'
    },
    {
        id: 12,
        name: 'কার্পেট',
        category: 'home',
        price: 5000,
        image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
        description: 'সুন্দর এবং টেকসই কার্পেট'
    }
];

let cart = [];
let currentCategory = 'all';

// পণ্য প্রদর্শন করুন
function displayProducts(filter = 'all') {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

    filteredProducts.forEach(product => {
        const productHTML = `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <span class="product-category">${getCategoryName(product.category)}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">৳ ${product.price.toLocaleString('bn-BD')}</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})">কার্টে যোগ করুন</button>
                        <a href="https://wa.me/8801XXXXXXXXX?text=আমি%20${encodeURIComponent(product.name)}%20অর্ডার%20করতে%20চাই।%20দাম:%20৳${product.price}" target="_blank" class="btn btn-whatsapp">
                            <i class="fab fa-whatsapp"></i> অর্ডার করুন
                        </a>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

// ক্যাটাগরি ক্লিক হ্যান্ডেলার
document.addEventListener('DOMContentLoaded', function() {
    displayProducts();

    // ক্যাটাগরি ফিল্টার
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            currentCategory = category;
            displayProducts(category);
            
            // সক্রিয় ক্যাটাগরি হাইলাইট করুন
            document.querySelectorAll('.category-card').forEach(c => c.style.backgroundColor = '');
            this.style.backgroundColor = 'var(--primary-color)';
            this.style.color = 'var(--white)';
        });
    });

    // নেভিগেশন লিংক
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// কার্টে যোগ করুন
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push(product);
    updateCartCount();
    showNotification(`${product.name} কার্টে যোগ হয়েছে!`);
}

// কার্ট কাউন্ট আপডেট করুন
function updateCartCount() {
    document.querySelector('.cart-count').textContent = cart.length;
}

// নোটিফিকেশন দেখান
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// ক্যাটাগরি নাম পান
function getCategoryName(category) {
    const names = {
        'electronics': 'ইলেকট্রনিক্স',
        'fashion': 'ফ্যাশন',
        'beauty': 'সৌন্দর্য',
        'home': 'বাড়ির সাজসজ্জা'
    };
    return names[category] || category;
}

// স্মুথ স্ক্রল
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});