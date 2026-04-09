# 🚂 RukiKyun? Express: Real-Time 3D Train Tracker

**RukiKyun? Express** is a high fidelity MERN stack application that provides real time tracking and status of Indian Railways. It combines live API data with a **Three.js 3D visualizer** to show train movement, overtakes, and station status in an immersive environment.

---

## 🚀 Key Features

* **Live Status Sync:** Fetches real-time GPS coordinates and station updates from RapidAPI.
* **3D Scene Automation:** Utilizes **Three.js** to visually represent the train's journey with smooth `useFrame` animations.
* **Dynamic Distance Logic:** A custom algorithm to calculate accurate distances to the next station by reconciling API cumulative distances with local schedule data.
* **Intelligent Status Engine:** Detects and displays special conditions like:
    * **Priority Overtakes:** Visualizes high priority trains passing.
    * **Platform Occupancy:** Detects if the target platform is full.
    * **Technical Halts:** Identifies signal or track maintenance stops.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js
* Three.js & @react-three/fiber (3D Engine)
* Tailwind CSS (Styling)
* Lucide React (Icons)

**Backend:**
* Node.js & Express
* MongoDB & Mongoose (Database)
* Axios (API Requests)

---

## 🌐 Live Demo

**Frontend:** [RukiKyun? Express](https://project-railway-eight.vercel.app)

---


---

## 🎨 Credits & Licenses

This project uses 3D assets to provide an immersive experience. Credits to the creators are listed below:

* **Train Model:** [Tangara Sydney Trains T set](https://sketchfab.com/3d-models/tangara-sydney-trains-t-set-07d7a69ffb544ec48442ae3448ee6f1f) by [A Certain Duck](https://sketchfab.com/ACertainDuck) is licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/).

---




Made with ❤️ by Charu Tiwari