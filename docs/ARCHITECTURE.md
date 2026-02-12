# 🏗️ Arquitectura Profesional - Studio Analytics

Este documento describe la arquitectura de alto nivel de Studio Analytics, diseñada para ser escalable, mantenible y profesional.

## 🎯 Principios de Diseño

- **Separación de Responsabilidades (SoC)**: Cada parte de la aplicación tiene una única responsabilidad. El código está organizado por funcionalidad (servicios, componentes, utilidades) en lugar de por tipo de archivo.
- **Modularidad**: La aplicación está construida como un conjunto de módulos independientes que pueden ser desarrollados, probados y mantenidos de forma aislada.
- **Escalabilidad**: La estructura de carpetas y la arquitectura están diseñadas para crecer fácilmente, permitiendo la adición de nuevas características sin refactorizaciones masivas.
- **Developer Experience (DX)**: Un proyecto bien organizado y documentado mejora la productividad y facilita la incorporación de nuevos desarrolladores.

---

## 📂 Estructura de Carpetas

La estructura del repositorio sigue un estándar empresarial moderno:

```
studio-analytics/
├── .github/         # Configuración de GitHub (Actions, templates)
├── docs/            # Documentación del proyecto
├── public/          # Archivos estáticos (HTML, imágenes, manifest)
├── src/             # Código fuente de la aplicación
│   ├── components/  # Componentes de UI reutilizables
│   ├── services/    # Lógica de negocio y comunicación con APIs
│   ├── utils/       # Funciones de utilidad
│   ├── config/      # Archivos de configuración
│   ├── styles/      # Estilos CSS
│   ├── workers/     # Service Workers y Web Workers
│   └── app.js       # Punto de entrada principal
├── tests/           # Pruebas (unitarias, integración, E2E)
├── scripts/         # Scripts de build, deploy, etc.
├── .env.example     # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

### `public/`
Contiene todos los assets estáticos que se sirven directamente al navegador sin ser procesados por un bundler. Esto incluye el `index.html` principal, imágenes, fuentes, `manifest.json`, etc.

### `src/`
El corazón de la aplicación. Todo el código fuente que necesita ser procesado (transpilado, empaquetado) reside aquí.

- **`components/`**: Contiene componentes de la interfaz de usuario. Cada componente es una pieza reutilizable de la UI (ej. un modal, un gráfico, el tutorial). Están organizados por funcionalidad.

- **`services/`**: Maneja la lógica de negocio y la comunicación con servicios externos. Por ejemplo, `services/firebase` se encarga de la autenticación y la base de datos, mientras que `services/analytics` contiene los algoritmos de análisis.

- **`utils/`**: Funciones de ayuda genéricas y reutilizables que no son específicas de ningún componente o servicio (ej. formateadores de fecha, validadores, helpers del DOM).

- **`config/`**: Archivos de configuración de la aplicación, como claves de API (cargadas desde variables de entorno), configuración de temas, o flags de características.

- **`styles/`**: Todos los archivos CSS. `main.css` es el punto de entrada que importa otros archivos, como variables, estilos de componentes y temas.

- **`workers/`**: Código para Service Workers (para PWA y offline) y otros Web Workers que pueden usarse para ejecutar tareas pesadas en segundo plano (como el análisis de datos) sin bloquear el hilo principal.

- **`app.js`**: El punto de entrada principal de la aplicación. Orquesta la inicialización de los diferentes módulos y servicios.

### `docs/`
Documentación detallada del proyecto, incluyendo esta guía de arquitectura, la documentación de la API, guías de despliegue y contribución.

### `tests/`
Contiene todas las pruebas automatizadas, separadas en unitarias, de integración y end-to-end (E2E).

---

## 🌊 Flujo de Datos

1.  **Inicio**: El navegador carga `public/index.html`.
2.  **Carga de Scripts**: El HTML carga los scripts desde `src/`, comenzando por `src/app.js`.
3.  **Inicialización**: `app.js` inicializa los módulos necesarios:
    - `services/firebase/auth.js` para verificar el estado de autenticación del usuario.
    - `Tutorial.js` para comprobar si el tutorial debe mostrarse.
    - Se asignan los event listeners a los elementos del DOM.
4.  **Interacción del Usuario**: El usuario interactúa con la UI (ej. sube un archivo).
5.  **Lógica de Componente**: El componente de UI correspondiente (ej. `UploadForm.js`) captura el evento.
6.  **Llamada al Servicio**: El componente llama a un servicio para realizar la lógica de negocio (ej. `services/analytics/analyzer.js` para procesar el archivo).
7.  **Procesamiento en Segundo Plano (Opcional)**: Si la tarea es pesada, el servicio puede delegarla a un Web Worker (`workers/analytics-worker.js`).
8.  **Actualización de la UI**: Una vez que el servicio completa su tarea, devuelve los datos al componente, que actualiza la interfaz para mostrar los resultados al usuario.

Esta arquitectura desacoplada asegura que la UI y la lógica de negocio estén separadas, haciendo que el código sea más fácil de entender, probar y mantener a largo plazo.
