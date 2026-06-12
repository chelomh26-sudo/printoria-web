# 🚀 Printoria 3D — Guía de despliegue

Todo gratis. Sigue los pasos en orden.

---

## PASO 1 — Instalar dependencias nuevas

Abre la terminal en la carpeta del proyecto y corre:

```bash
npm install
```

---

## PASO 2 — Crear base de datos en Supabase (5 min)

1. Ve a **supabase.com** → crea cuenta gratis → **New project**
2. Dale un nombre (ej. `printoria`) y una contraseña → **Create project** (espera ~1 min)
3. Ve a **SQL Editor** (menú izquierdo) → pega todo el contenido de `supabase_schema.sql` → **Run**
4. Ve a **Settings → API** → copia:
   - **Project URL** → algo como `https://abcdefg.supabase.co`
   - **anon public key** → cadena larga que empieza con `eyJ...`

---

## PASO 3 — Crear archivo .env

En la carpeta del proyecto crea un archivo llamado `.env` (copia `.env.example`) y llena:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...TU-CLAVE...
```

Guarda el archivo. Prueba local con `npm run dev` — si funciona, continúa.

---

## PASO 4 — Subir código a GitHub (3 min)

1. Ve a **github.com** → crea cuenta gratis → **New repository**
2. Nómbralo `printoria-web` → **Create repository** (privado o público, tú decides)
3. En la terminal del proyecto:

```bash
git init
git add .
git commit -m "Printoria 3D v1.0"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/printoria-web.git
git push -u origin main
```

---

## PASO 5 — Desplegar en Vercel (2 min)

1. Ve a **vercel.com** → crea cuenta con tu GitHub
2. **Add New Project** → selecciona `printoria-web`
3. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu clave anon
4. Click **Deploy** → espera ~1 min

Tu catálogo público queda en: `https://printoria-web.vercel.app/#catalogo`
Tu panel de manejo: `https://printoria-web.vercel.app`

---

## PASO 6 — Instalar como app en iPhone (30 seg)

1. Abre Safari en tu iPhone
2. Ve a `https://printoria-web.vercel.app`
3. Toca el botón **compartir** ⬆️ (abajo en Safari)
4. Toca **"Añadir a pantalla de inicio"**
5. Dale el nombre **Printoria** → **Añadir**

Aparece en tu home screen como app. Se abre sin barra del navegador.

---

## PASO 7 — Meter la info real

Con la app instalada o en el navegador, abre el panel y llena:

| Página | Qué llenar |
|---|---|
| ⚙️ Configuración | WhatsApp, Instagram, Gmail, Slogan, Ciudad, Sobre nosotros |
| 📦 Productos | Nombre, precio, foto 📷, descripción, ✓ Publicar en catálogo |
| 📸 Galería Fotos | Arrastra fotos de trabajos que hayas hecho |

Los cambios aparecen en el catálogo público **al instante**.

---

## Dominio propio (opcional, ~$150/año)

Si quieres `printoria3d.com` en vez de `printoria-web.vercel.app`:
1. Compra el dominio en **namecheap.com** o **godaddy.com**
2. En Vercel → tu proyecto → **Domains** → agrega tu dominio
3. Sigue las instrucciones de DNS (5 min)

---

## ¿Algo sale mal?

Escríbeme en el chat de la app. 🤖
