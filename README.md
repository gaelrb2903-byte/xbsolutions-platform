# wxbsolutions · Plataforma interna de prospección

Plataforma para que los vendedores remotos prospecten (guion, lista de negocios en
tiempo real, agendar citas) y para que el admin lo administre todo (citas, negocios,
CSV con dedup, vendedores, y guiones IA por negocio con Gemini).

- **Frontend:** React + Vite → Netlify
- **Datos:** Firebase Firestore (tiempo real)
- **Auth:** Firebase Auth (usuario+contraseña, sin texto plano) + custom claims (`admin` / `seller`)
- **Servidor:** Netlify Functions (alta/baja de vendedores con Admin SDK, generación de guiones con Gemini)

---

## 1. Requisitos

- Node 18+ y npm
- Una cuenta de **Firebase** (plan Spark gratuito basta)
- Una cuenta de **Netlify**
- Una **API key de Gemini** (Google AI Studio, gratis, sin tarjeta): https://aistudio.google.com/apikey

## 2. Crear el proyecto Firebase

1. https://console.firebase.google.com → **Agregar proyecto**.
2. **Authentication** → Sign-in method → habilita **Correo/contraseña**.
3. **Firestore Database** → crear base de datos (modo producción).
4. **Reglas** → pega el contenido de [`firestore.rules`](firestore.rules) y publica.
5. **Project settings → General → Tus apps → Web (`</>`)** → registra una app y copia la config.
6. **Project settings → Cuentas de servicio → Generar nueva clave privada** → descarga el JSON
   (lo usarás como `serviceAccount.json` / `FIREBASE_SERVICE_ACCOUNT`). **No lo subas a git.**

## 3. Variables de entorno

Copia `.env.example` a `.env` y rellena:

```bash
cp .env.example .env
```

- `VITE_FIREBASE_*` → de la config web del paso 2.5 (son públicas, sin problema).
- `GEMINI_API_KEY` → tu key de Google AI Studio.
- `FIREBASE_SERVICE_ACCOUNT` → el JSON del paso 2.6 **en una sola línea**.

## 4. Instalar y crear el admin (tú)

```bash
npm install
```

Crea tu usuario admin en **Firebase Console → Authentication → Agregar usuario**
(email + contraseña). Luego otórgale el rol admin:

Si ya pegaste `FIREBASE_SERVICE_ACCOUNT` en tu `.env` (paso 3), simplemente:

```bash
npm run set-admin -- tu-correo@ejemplo.com
```

Entras a la plataforma con **ese correo** y tu contraseña.

## 5. Correr en local

Con la CLI de Netlify (recomendado, así también corren las funciones):

```bash
npm install -g netlify-cli
netlify dev
```

Abre http://localhost:8888. (Solo `npm run dev` levanta el front, pero las
funciones de vendedores/guiones no responderán.)

## 6. El logo

Coloca tu archivo en `public/logo.png`. Se usa en login, encabezado y favicon.
Mientras no exista, se muestra un wordmark de texto como respaldo.

## 7. Desplegar en Netlify

1. Sube el repo a GitHub y en Netlify: **Add new site → Import** (o `netlify deploy`).
2. Build ya está en `netlify.toml` (`npm run build`, publish `dist`).
3. **Site settings → Environment variables** → agrega **todas** las del `.env`
   (las `VITE_*`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `SELLER_EMAIL_DOMAIN`).
4. Deploy.

---

## Uso

### Admin (tú)
- **Citas:** todas las citas del equipo, con quién las agendó.
- **Negocios:** alta manual, o **subir CSV** (`nombre, contacto, telefono, categoria`) con
  **dedup por teléfono**. Botón **Generar** guion IA por negocio (Gemini, uno a la vez; se guarda).
- **Vendedores:** alta (nombre, usuario, contraseña) y baja.

### Vendedor
- **Guion:** guion base de referencia.
- **Negocios:** lista en **tiempo real**; cambia estatus (Pendiente / Contactado / Interesado /
  No interesado) y todos lo ven al instante. Botón para llamar y para agendar. Si el negocio
  tiene guion IA, aparece **★ Guion IA**.
- **Agendar cita:** formulario que queda registrado para el admin.

## Estructura

```
src/
  firebase.js, api.js, AuthContext.jsx    # infra
  useCollections.js                       # onSnapshot en tiempo real
  csv.js, phone.js, baseScript.js         # utilidades y guion base
  pages/  Login, SellerApp, AdminApp, admin/*
  components/  Layout, BusinessList, ScheduleForm, ScriptView, StatusBadge, Modal, Logo
netlify/functions/
  create-seller.mjs, delete-seller.mjs, generate-script.mjs, lib/admin.mjs
firestore.rules   scripts/setAdmin.mjs   sample-businesses.csv
```

## Notas de seguridad
- Contraseñas: nunca en texto plano; las gestiona Firebase Auth.
- Las funciones verifican el ID token del llamador y exigen rol `admin`.
- La `GEMINI_API_KEY` y el service account viven **solo** en el servidor.
- Las reglas de Firestore limitan lo que cada rol puede leer/escribir.
