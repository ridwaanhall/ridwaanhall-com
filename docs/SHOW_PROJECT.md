# FlexForge - Advanced Developer Portfolio Platform

![FlexForge Portfolio](https://ridwaanhall.com/static/img/project/ridwaanhall_com_2025070701.webp)

## Deskripsi Proyek

**FlexForge** adalah platform portfolio developer yang dibikin pakai Django 5.2.5 buat nunjukin karya dan aktivitas coding dengan style maksimal. Ngegabungin performa ngebut, keamanan enterprise-grade, dan sistem manajemen konten inovatif. Template portfolio yang gampang di-customize, bisa nyambungin data real-time dari GitHub & WakaTime, chat-like guestbook, plus sistem file terpisah yang fleksibel. PageSpeed 95+/100 dengan keamanan CSP, HSTS, dan XSS protection.

## Tech Stack

- **Backend:** Django 5.2.5, Python 3.12+, SQLite3/PostgreSQL, django-allauth, django-csp, django-permissions-policy
- **Frontend:** TailwindCSS, Vanilla JavaScript, SVG icons, Onest fonts
- **APIs:** GitHub (GraphQL), WakaTime (REST), OAuth (Google, GitHub), Web3Forms
- **Deployment:** Vercel (serverless), WhiteNoise, wsrv.nl CDN, Django cache, python-decouple
- **Security:** SSL/TLS, HSTS, CSP, CSRF protection, Input validation, Error logging

## Fitur Utama

### Sistem File Individual

- Setiap proyek & blog post disimpen dalam file Python terpisah
- Version control individual, ga ribet
- Caching & lazy loading yang cerdas
- Struktur rapi, skalabilitas unlimited

### Analitik Real-time

- GitHub API: contribution graph, streak, avg, etc.
- WakaTime API: tracking waktu coding & produktivitas
- Dashboard analytics dengan visualisasi keren
- Cache 3 jam buat optimasi performa

### Guestbook Interaktif (Opsional)

- Interface chat-like yang modern
- OAuth login (Google & GitHub)
- Bisa diaktifin/matiin sesuai kebutuhan
- Real-time updates

### Performa & Keamanan

- PageSpeed: Desktop 97/100, Mobile 91/100
- Format WebP + resize otomatis (wsrv.nl)
- CSP, HSTS, XSS protection
- CSRF protection & input validation

### Desain Responsif

- TailwindCSS + Vanilla JavaScript
- Mobile-first optimization
- Smooth animations & interactive effects
