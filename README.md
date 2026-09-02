# Melodex - Musical Instruments & Accessories Store 🎸

A modern e-commerce store for premium musical instruments and accessories built with HTML, CSS, and JavaScript. Hosted on GitHub Pages for free.

## ✨ Features

✅ **Complete Product Catalog** - 24+ musical instruments and accessories  
✅ **5 Category Filters** - Guitars, Pedals, Pedalboards, Stands, Cables  
✅ **Price Display** - Clear pricing in BDT (৳)  
✅ **Product Images** - Category-based emoji icons  
✅ **WhatsApp Integration** - Order directly via WhatsApp  
✅ **Shopping Cart** - Add items and track cart count  
✅ **Mobile Responsive** - Perfect display on all devices  
✅ **Free Hosting** - Powered by GitHub Pages  
✅ **Professional Design** - Modern UI with smooth animations  
✅ **No Database Required** - Static site with JavaScript data

## 📂 File Structure

```
ecommerce-store/
├── index.html       # Main HTML file
├── styles.css       # Styling
├── script.js        # JavaScript functionality
└── README.md        # This file
```

## 🚀 Getting Started

### Enable GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** section
3. Select **main** branch as source
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Access Your Store

Once deployed, visit:
```
https://MelodexBD.github.io/ecommerce-store
```

## 🎨 Product Categories

### Guitars
- Luxurs SG62 Headless Electric Guitar — ৳29,990
- Yifenli Stratocaster Electric Guitar
- LETTU Veneer Wooden Acoustic Guitar — ৳13,500
- Crafty Acoustic Guitar + Free Accessories — ৳4,600

### Pedals & Effects
- Harmonize Pedal — Aroma Ahar-3 — ৳5,500
- Caline CP31P Volume Pedal — ৳6,500
- DF1511A Stereo Volume Pedal — ৳4,550
- Universal Sustain Pedal — ৳1,500

### Pedalboards & Power
- Electric Pedal Board — Aluminium Velcro — ৳4,500
- Ultra Lightweight EVA Pedal Board — ৳2,800
- Irin 8-Way 9V Power Supply — ৳3,500
- Ghostfire T-Series Effector Cases (T-EC6 & T-EC8)
- Rockhouse Patch Cables — 6 pcs — ৳1,300

### Stands
- Portable Double-Layer Keyboard Stands (1.2m & 1.4m)
- Keyboard Stand Extension — ৳3,000
- Smiger & Winerten Guitar Stands

### Cables & Accessories
- Silver Sipai Inspire Guitar Cable
- Yongwei Guitar/Keyboard Cable
- HK Guitar/Keyboard Cable — Metal Head
- Gold-Plated 6.35mm Mono Audio Cable

## ⚙️ Customization

### Update WhatsApp Number

Open `script.js` and find the WhatsApp link. Replace:
```javascript
https://wa.me/8801XXXXXXXXX
```
With your actual WhatsApp number.

### Add New Products

Edit `script.js` and add to the `products` array:
```javascript
{
    id: 25,
    name: 'Product Name',
    category: 'guitars', // guitars, pedals, pedalboards, stands, cables
    price: 9999,
    icon: '🎸',
    description: 'Product description here'
}
```

### Customize Colors

Edit `styles.css` - Update the `:root` section:
```css
:root {
    --primary-color: #E63946;      /* Main red color */
    --secondary-color: #F77F88;    /* Secondary color */
    --dark-color: #1D3557;         /* Dark background */
}
```

### Update Contact Information

Edit `index.html` - Contact section (around line 91):
```html
<p>+88 01XXXXXXXXX</p>       <!-- Phone -->
<p>info@melodex.com</p>      <!-- Email -->
<a href="#">Visit Our Facebook</a>  <!-- Facebook link -->
```

## 📱 Mobile Optimization

The website is fully responsive with breakpoints at:
- **Desktop**: Full layout with multiple columns
- **Tablet** (768px): Adjusted grid layout
- **Mobile** (480px): Single column responsive design

## 🔧 Features Implementation

### Shopping Cart
- Click "Add to Cart" to increment cart counter
- Cart count displays in navbar
- Notification appears when item is added

### WhatsApp Orders
- Click "Order Now" button
- Automatically sends product details to WhatsApp
- Customer can confirm and proceed with payment

### Category Filtering
- Click category cards to filter products
- Active category highlights in primary color
- Updates product display instantly

## 🌐 Facebook Ad Integration

Use this link in your Facebook ads:
```
https://MelodexBD.github.io/ecommerce-store
```

All traffic from Facebook ads will land on your store with full product catalog and WhatsApp ordering.

## 🎨 Current Color Scheme

- **Primary Red**: #E63946 (Main brand color)
- **Secondary Red**: #F77F88 (Gradients)
- **Dark Blue**: #1D3557 (Navbar/Footer)
- **Light Background**: #F8F9FA

## 🔮 Future Enhancements

- [ ] Add high-quality product images
- [ ] Implement payment gateway integration
- [ ] Add order tracking system
- [ ] Create admin dashboard
- [ ] Add inventory management
- [ ] Customer reviews & ratings

## 📝 License

This project is open source and available for personal and commercial use.

## 📞 Support

For issues or feature requests:
1. Create a GitHub Issue
2. Include detailed description
3. Contact via social media

---

**Happy Selling!** 🎸🎹🎹

*Melodex - Your Musical Journey Starts Here*