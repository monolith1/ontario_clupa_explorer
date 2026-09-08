# 🌲 Ontario CLUPA Explorer

A modern, fast, and intuitive replacement for the Ontario Crown Land Use Policy Atlas (CLUPA). Filter Crown land areas by permitted activities (camping, hunting, fishing, ATV, prospecting), land designations, and Ministry of Natural Resources (MNR) districts across Ontario.

---

## 🚀 Live Deployment to Vercel (100% Free)

This project includes `vercel.json` pre-configured to proxy Ontario's official ArcGIS REST API without CORS restrictions.

### Step 1: Initialize Git and Push to GitHub
In your project directory (`c:\Users\monol\wkdir\code\CLUPAS`), run:

```bash
git init
git add .
git commit -m "Initial commit of Ontario CLUPA Explorer"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/clupas.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select your `clupas` repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **"Deploy"**.

Within ~30 seconds, Vercel will give you a live URL like `https://clupas.vercel.app` with free automatic SSL/HTTPS that you can share with friends and testers!

---

## 🛠️ Alternative Free Hosting Options

* **Cloudflare Pages**: Connect your GitHub repo on [Cloudflare Pages](https://pages.cloudflare.com/). Build command: `npm run build`, Output directory: `dist`. The included `public/_redirects` file handles API rewrites automatically.
* **Netlify**: Connect your GitHub repo or drag-and-drop the `dist` folder onto [Netlify](https://www.netlify.com/).

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

---

## 🗺️ Datasets & Attribution
* **Crown Land Use Policy Atlas (CLUPA)**: Ontario Ministry of Natural Resources (MNR) & Geospatial Ontario under the [Open Government Licence – Ontario](https://www.ontario.ca/page/open-government-licence-ontario).
* **Basemaps**: Esri World Dark Gray Canvas, Esri World Topographic, Esri World Imagery, OpenStreetMap.
