<div align="center">

# 🌙 Nocturne Stays

**A full-stack hotel booking platform — dark, modern, built entirely on free tools.**

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=black)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)
![Cost](https://img.shields.io/badge/Cost-%240-brightgreen)
![License](https://img.shields.io/badge/license-Educational-yellow)

**[🌐 Live Demo](https://nocturne-stays-project.vercel.app)** · **[📜 README](#-table-of-contents)** · **[⚡ Quick Start](#-quick-start)**

</div>

---

## 📑 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [☁️ Deploy in 3 Steps](#️-deploy-in-3-steps)
- [📁 Project Structure](#-project-structure)
- [🔐 Environment Variables](#-environment-variables)
- [🔒 Security](#-security)
- [👤 Author](#-author)

---

## 🌐 Live Demo

> 🔗 **[https://nocturne-stays.vercel.app](https://nocturne-stays.vercel.app)**
>
> *Deployed on Vercel (frontend) + Render (backend) + Supabase (database) — all free tiers.*
> Haven't deployed yet? Follow [Deploy in 3 Steps](#️-deploy-in-3-steps), then replace this link with your own Vercel URL.

**Demo admin login**

| Role | Email | Password |
|:----:|-------|----------|
| 🔑 Admin | `admin@nocturne.stays` | `Admin@2467` |

---

## ✨ Features

| Icon | Feature | Description |
|:----:|---------|-------------|
| 🔐 | **Authentication** | JWT login/register with **user & admin** roles (bcrypt hashing) |
| 🏨 | **Hotel catalog** | 5 hotels · 3 room tiers · live DB-driven pricing |
| 🛡️ | **Double-booking guard** | Overlapping dates are blocked at the database layer |
| 🧾 | **Instant receipt** | Clean paper layout → *Print → Save as PDF* (A4) |
| ✅ | **Admin dashboard** | Approve / decline · search · date filters · pagination · user directory |
| ❌ | **Cancellation** | Guests cancel bookings + full **status audit trail** |
| ⭐ | **Landing highlights** | Featured stays & per-hotel guest reviews |
| 📱 | **Responsive UI** | Charcoal glassmorphism · pro animations · mobile-perfect |
| ⚡ | **Blazing fast** | Vanilla JS ES modules — no framework, no build step |

---

## 🛠️ Tech Stack

| Layer | Tech | Hosting | Cost |
|-------|------|:-------:|:----:|
| 🎨 Frontend | [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) · [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) · [Vanilla JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript) · [Tailwind](https://tailwindcss.com) *(vendored locally)* | **[Vercel](https://vercel.com)** | Free |
| ⚙️ Backend | [Node.js](https://nodejs.org) + [Express](https://expressjs.com) | **[Render](https://render.com)** | Free |
| 🗄️ Database | [Supabase](https://supabase.com) (PostgreSQL + Row Level Security) | **[Supabase](https://supabase.com)** | Free |
| 🔑 Auth | JWT + bcrypt — no paid auth service | — | Free |
| 🧾 Receipts | Browser *Print → Save as PDF* | — | Free |

> **Total cost: $0** — free tiers only. No payment gateway, no email service.

---

## 🚀 Quick Start

```bash
cd nocturne
cp .env.example .env      # fill in Supabase URL, service-role key, JWT_SECRET
npm install
npm run dev               # → http://localhost:3000
```

**1.** Open **Supabase → SQL Editor**, paste all of [`db/schema.sql`](db/schema.sql), and **run it once**
&nbsp;&nbsp;&nbsp;&nbsp;— creates every table, enables RLS, seeds hotels + admin.

**2.** Log in as admin: `admin@nocturne.stays` / `Admin@2467`

---

## ☁️ Deploy in 3 Steps

| # | Where | What to do |
|:-:|-------|------------|
| 1 | 🗄️ **[Supabase](https://supabase.com)** | Create free project → run [`db/schema.sql`](db/schema.sql) → copy *Project URL* + *service_role key* |
| 2 | 🟢 **[Render](https://render.com)** | New Web Service → root `nocturne` → build `npm install` → start `npm start` → health `/api/health` → add env vars |
| 3 | ▲ **[Vercel](https://vercel.com)** | Add project → root `nocturne` → point [`vercel.json`](vercel.json) `destination` at your Render URL → deploy |

> 💡 Local dev needs no proxy — Express serves the frontend itself.

---

## 🔒 Security

| Layer | Protection |
|-------|-----------|
| 🗄️ Database | **Row Level Security** on all tables · anon = read-only · secret key stays on server |
| ⚙️ Backend | Rate limiting · Zod validation · bcrypt · Helmet CSP · generic auth errors |
| 🎨 Frontend | Escaped output · `rel="noopener"` · JWT stored safely · no secrets shipped |

---

## 👤 Author

<div align="center">

**Owais Ahmed Siddiqui** — Roll No. *2467* · *2024*

*Educational project — modify and use as needed.*

![Profile](https://img.shields.io/badge/Designed%20by-Owais_Ahmed-17181C?style=for-the-badge&logo=github&logoColor=white)

</div>
