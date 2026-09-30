# Cognitive

Propuestas de sitio para **Cognitive** (cognitive.la), de Digital Arts: una portada con contraseña, **«Propuestas de Sitios»**, con tres opciones, y cada opción es un sitio navegable.

| Opción | Nombre | Proyecto de origen | Ruta |
|---|---|---|---|
| A | Narrativa | `Cognitive-B` | `/dev/cognitive-sitios/cognitive-a` |
| B | Hologramas | `Cognitive-Intermedia` | `/dev/cognitive-sitios/cognitive-b` |
| C | Inmersiva | `Cognitive-C` | `/dev/cognitive-sitios/cognitive-c` |

La portada está en `/dev/cognitive-sitios`. La contraseña se comparte aparte: en el código queda solo su hash.

## Cómo está armado

Es una app Next.js 16 mínima, con ruta base `/dev/cognitive-sitios` (`lib/base.ts`).

- **Portada:** `app/page.tsx`. Sin sesión pide la contraseña (formulario HTML a `app/ingresar/route.ts`, anda con o sin JavaScript); con sesión muestra las tres cards.
- **Propuestas:** `public/cognitive-a`, `-b` y `-c`. Son **exportaciones estáticas** de cada proyecto de Cognitive, hechas con su ruta base, así que se sirven como archivos.
- **Video del hero:** es el mismo en las tres propuestas, así que está una sola vez, en `public/compartido`: `hero-video-1280.mp4` (apaisado, desktop) y `hero-video-440.mp4` (vertical, teléfono).
- **Protección:** `proxy.ts` (el middleware de Next 16), con la lógica en `lib/sitios.ts`. Sin sesión, cualquier página o archivo de una propuesta vuelve a la portada, y después de ingresar se vuelve a donde se iba. Además, resuelve las páginas de las propuestas a su `index.html` y sirve el video compartido.
- **Indexación y caché:** nada se indexa (`X-Robots-Tag` y `robots` en la metadata), y nada se guarda en cachés compartidas.
- **Formulario de contacto:** en las propuestas no envía, porque son archivos estáticos sin servidor. Muestra el aviso de escribir a info@cognitive.la.

## Correr en local

```bash
npm install
npm run dev        # http://localhost:3240/dev/cognitive-sitios
npm run build && npm run start   # lo mismo, en modo producción
```

## Publicar en el VPS

Va como una app aparte, detrás del mismo dominio.

1. **Clonar e instalar:**
   ```bash
   git clone <url-del-repo> /var/www/cognitive-sitios
   cd /var/www/cognitive-sitios
   npm ci
   npm run build
   pm2 start npm --name cognitive-sitios -- start    # escucha en el puerto 3240
   pm2 save
   ```
2. **nginx:** en el `server` de bydigitalarts.com, **antes** del `location /` que va al sitio principal:
   ```nginx
   location /dev/cognitive-sitios {
       proxy_pass http://127.0.0.1:3240;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   `proxy_pass` va sin barra final, para que la ruta llegue completa. Después: `nginx -t && systemctl reload nginx`.
3. **Actualizar:** `git pull && npm ci && npm run build && pm2 restart cognitive-sitios`.

> `digitalarts.com.ar` redirige a `bydigitalarts.com` desde Cloudflare (conserva la ruta), así que `digitalarts.com.ar/dev/cognitive-sitios` termina en `bydigitalarts.com/dev/cognitive-sitios`.

Si el puerto 3240 está ocupado en el servidor, se cambia en `package.json` (`start`) y en el `proxy_pass`.

## Actualizar una propuesta

En el proyecto de origen (conviene una **copia**, porque el build pisa su `.next`):

```bash
EXPORT_BASE_PATH=/dev/cognitive-sitios/cognitive-a npx next build
```

En Git Bash de Windows, anteponer `MSYS_NO_PATHCONV=1` (si no, convierte la ruta).

Después:

1. Reemplazar `public/cognitive-a` por la carpeta `out/` que generó el build.
2. Borrar de ahí `media/prueba/hero-video-1280.mp4` y `media/prueba/hero-video-440.mp4`: se sirven desde `public/compartido`. Si el video cambió, reemplazar los de `public/compartido`.

Para B y C es lo mismo, con `cognitive-b` y `cognitive-c`.

## Cambiar la contraseña

Reemplazar `CLAVE_SHA256` en `lib/sitios.ts` por el SHA-256 de la nueva:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('LA-NUEVA-CLAVE').digest('hex'))"
```

Las sesiones abiertas se cierran solas: la cookie se deriva del hash.
