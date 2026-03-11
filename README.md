# GU Travel

## هيكل المشروع
```
gu-travel/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── public/
│   ├── bus-system-image.png   ← انسخه من مشروعك القديم
│   └── fonts/
│       ├── cairo-arabic.woff2      ← انسخهم من مشروعك القديم
│       ├── cairo-latin-ext.woff2
│       └── cairo-latin.woff2
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```

## تشغيل المشروع

```bash
# تثبيت الـ dependencies
npm install

# تشغيل للتطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة الـ build
npm run preview
```

## رفع على GitHub Pages

```bash
npm run build
# ارفع محتوى فولدر dist/
```
