<p align="center">
  <img src="assets/images/banner.png" alt="Knights Banner" />
</p>

# ⚔️ Knights
*A tiny round-based battle game built for mobile and desktop.*

---

## 🎮 Overview
**Knights** is a minimalist round-based battle game built with Phaser.  
It focuses on a simple combat triangle:

- **Attack** – spend x breath to deal x damage  
- **Defend** – spend 1 breath to avoid enemy damage and make them lose their breath on successful defense. On successful defense, breath is not spent.  
- **Breathe** – recover breath to enable future attacks or defenses  

The game runs in any modern browser and supports installation as a **Progressive Web App (PWA)**.

---

## ✨ Features
- Mobile-first responsive layout  
- Works offline using a service worker  
- Installable on Android, iOS, Windows  
- Simple heart-based combat mechanic  
- Easy-to-modify code structure  
- No build tools required (runs directly in browser)  

---

## ⚙️ Project Structure
```
index.html
main.js
sw.js
manifest.webmanifest

/css
/scenes
/components
/assets
/icons
```

---

## 🚀 Running the Game (VS Code + Live Server)
1. Install the **Live Server** extension  
2. Open the project folder in VS Code  
3. Click **Go Live** in the bottom bar  
4. The game opens at:  
   ```
   http://127.0.0.1:5500
   ```

---

## 📱 Installing as a PWA

### Android
Chrome → Menu → **Install App**

### iOS (Safari)
Share → **Add to Home Screen**

### Windows (Chrome/Edge)
Menu → **Install this site as an app**

---

## 🧪 Service Worker Notes
- The service worker only works over **localhost** or **https**
- If updates don’t appear:
  - Open DevTools → Application → Service Workers  
  - Click **Unregister**
  - Refresh with **Ctrl + Shift + R**  
- When updating cached files, bump the version in `sw.js`:
  ```js
  const CACHE_NAME = "knights-cache-v2";
  ```

---

## 🛡 Controls
| Action | Effect |
|--------|--------|
| Attack | Spend x breath to deal x damage (e.g 2 breaths for 2 damage on enemy) |
| Defend | Spend 1 breath to avoid an enemy attack. If successful defense you recover your used breath |
| Breathe | Recover breath to power up attacks and defenses, manage it wisely |

---

## 📜 License
This project is open for learning and modification.
