# 🚀 Nimbuscodex — CRM de Prospección Comercial & Análisis de Tonos IA

Aplicación web para gestión comercial de agencias y estudios de diseño y desarrollo web. Incluye detección de tonos bilingües (Español / Chino comercial en Redbook 小红书 y WeChat 微信), pipeline kanban por estados 0 a 5, resolución de objeciones con IA, exportación/importación de backup completo JSON y persistencia en servidor para trabajo multiusuario.

---

## 🤖 1. Cómo Conectar Gemini a la Web

La aplicación utiliza el SDK oficial `@google/genai` con el modelo `gemini-3.8-flash` para:
- Análisis semántico profundo de tonos de mensajes (detecta cortesía, Guanxi, pragmatismo ROI y propuesta de valor).
- Generación de respuestas tácticas ante objeciones y rechazos de clientes.

### Paso 1.1: Obtener la API Key de Gemini
1. Accede a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"Create API key"** (Crear clave de API).
4. Copia la clave generada (empieza por `AIzaSy...`).

### Paso 1.2: Configurar la Clave en el Proyecto

#### En local (tu ordenador):
1. En la raíz del proyecto, crea un archivo llamado `.env` (o renombra `.env.example` a `.env`):
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y pega tu clave:
   ```env
   GEMINI_API_KEY="AIzaSyTuClaveDeGeminiAqui"
   PORT=3000
   ```

#### En Google AI Studio:
- Si ejecutas la app dentro de Google AI Studio, la plataforma inyecta automáticamente la clave `GEMINI_API_KEY` desde el panel de secretos sin necesidad de editar archivos.

---

## 🐙 2. Cómo Subir el Proyecto a GitHub

Sigue estos pasos en tu terminal (en la carpeta del proyecto):

### Paso 2.1: Comprobar que `.gitignore` protege tus secretos
Asegúrate de que el archivo `.env` no se suba nunca a GitHub para proteger tu clave:
```bash
git status
```
*(Verifica que `.env` NO aparezca en la lista de archivos a subir).*

### Paso 2.2: Inicializar y hacer el primer commit
```bash
# 1. Inicializar repositorio git local (si no está inicializado)
git init

# 2. Añadir todos los archivos del proyecto
git add .

# 3. Crear el primer commit
git commit -m "feat: CRM de prospección web con análisis de tono Gemini y backup JSON"
```

### Paso 2.3: Crear el repositorio en GitHub y subirlo
1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio (haz clic en **"New repository"**).
2. Ponle nombre (ej: `crm-prospeccion-web`).
3. Elige si es **Público** o **Privado**. No marques "Initialize with README" si ya tenemos uno.
4. Copia los comandos que te muestra GitHub y ejecútalos en tu terminal:

```bash
# Cambiar nombre de la rama principal a main
git branch -M main

# Conectar tu repositorio local con el remoto de GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Subir el código a GitHub
git push -u origin main
```

---

## 💻 3. Cómo Ejecutar el Proyecto en Cualquier Ordenador

Cualquier persona o tú mismo en otro equipo puede correr el proyecto así:

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO

# 2. Instalar las dependencias
npm install

# 3. Crear el archivo .env con tu API Key
cp .env.example .env
# Edita .env y coloca tu GEMINI_API_KEY

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## 💾 4. Compartir Enlaces y Migración de Datos (Backup JSON)

- **Persistencia en Servidor (`data/leads_db.json`)**: Cada vez que agregas, modificas o eliminas un lead, se guarda tanto en tu navegador como en el servidor backend. Si reenvías el enlace de la web a otra persona, verá todos tus clientes actualizados.
- **Backup Completo JSON**: Desde la pestaña **Configuración & Backup**:
  - Haz clic en **"Descargar Copia Completa (.json)"** para guardar un archivo con todos los prospectos, mensajes, notas y transiciones de estado.
  - Usa **"Seleccionar Archivo JSON de Backup"** para restaurar una copia en cualquier instalación con un solo clic.
