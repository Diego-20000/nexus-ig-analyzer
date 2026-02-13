# 📍 Recordatorios - Location-Based Reminders

<div align="center">

![Logo](https://img.shields.io/badge/NexusApp-Estudio-gold?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Android-green?style=for-the-badge)

**La aplicación inteligente que te recuerda cosas cuando llegas a un lugar**

[Términos](./TERMS_OF_SERVICE.md) • [Privacidad](./PRIVACY_POLICY.md) • [Soporte](#soporte)

</div>

---

## 🎯 ¿Qué es Recordatorios?

**Recordatorios** es una aplicación móvil profesional desarrollada por **NexusApp Estudio** que utiliza la tecnología de geofencing para activar recordatorios automáticamente cuando te acercas a una ubicación específica.

### 💡 Casos de Uso

- 🛒 **Compras:** "Comprar leche" se activa cuando pasas cerca del supermercado
- 💊 **Salud:** "Recoger medicamentos" se activa cerca de la farmacia
- 🏋️ **Fitness:** "Llevar toalla" se activa cuando vas al gimnasio
- 🏠 **Hogar:** "Regar plantas" se activa cuando llegas a casa
- 💼 **Trabajo:** "Hablar con Juan" se activa en la oficina
- 🎓 **Educación:** "Devolver libro" se activa cerca de la biblioteca

---

## ✨ Características Principales

### 🗺️ Mapa Interactivo Profesional

- Basado en **OpenStreetMap** (100% gratuito, sin límites)
- Búsqueda de lugares con autocompletado
- Geocodificación inversa automática
- Tema oscuro elegante
- Marcadores y círculos de geofencing visuales

### 📱 Funcionalidad en Segundo Plano

- Monitoreo continuo de ubicación incluso con la app cerrada
- Notificaciones automáticas al llegar a lugares configurados
- Optimizado para consumo mínimo de batería
- Hasta 20 recordatorios activos simultáneamente

### 🎨 Categorías y Organización

7 categorías predefinidas con iconos personalizados:

- 🏠 Casa
- 💼 Trabajo
- 🛒 Compras
- 🏋️ Gimnasio
- 💊 Farmacia
- 🍽️ Restaurante
- 🎓 Escuela

### 📊 Estadísticas y Analytics

- Racha de días consecutivos de uso
- Contadores de recordatorios (total, activos, completados)
- Notificaciones enviadas
- Tiempo promedio de completación
- Top categorías más usadas con gráficos
- Distribución por estado

### 🔐 Privacidad Total

- **Cero servidores:** Todos los datos permanecen en tu dispositivo
- **Sin seguimiento:** No usamos analíticas ni cookies
- **Sin anuncios:** Experiencia limpia y profesional
- **Open source friendly:** Usa servicios de código abierto

---

## 📲 Instalación

### Requisitos

- **Android:** 7.0 (API 24) o superior
- **Permisos:** Ubicación (siempre activo), Notificaciones
- **Espacio:** ~50 MB
- **Internet:** Opcional (solo para búsqueda de lugares)

### Descargar

1. **Desde GitHub Releases:**
   ```
   https://github.com/Diego-20000/Nexus-ig-analyzer/releases
   ```

2. **Instalación manual:**
   - Descarga el archivo APK
   - Habilita "Fuentes desconocidas" en Configuración → Seguridad
   - Abre el APK y sigue las instrucciones

3. **Permisos necesarios:**
   - Ubicación: Selecciona "Permitir siempre"
   - Notificaciones: Habilita para recibir alertas

---

## 🎮 Cómo Usar

### 1️⃣ Primer Uso (Onboarding)

Al abrir la app por primera vez:

1. Lee la introducción
2. Otorga permiso de ubicación (selecciona "Siempre")
3. Otorga permiso de notificaciones
4. ¡Listo para crear tu primer recordatorio!

### 2️⃣ Crear un Recordatorio

1. Toca el botón **+** flotante en la pantalla principal
2. Escribe el título (ej: "Comprar leche")
3. Busca el lugar o toca en el mapa
4. Ajusta el radio de proximidad
5. Selecciona categoría y prioridad
6. Agrega notas opcionales
7. Toca "Crear Recordatorio"

### 3️⃣ Gestionar Recordatorios

- **Editar:** Toca un recordatorio en la lista
- **Eliminar:** Desliza hacia la izquierda
- **Completar:** Marca como completado desde la notificación
- **Desactivar:** Desactiva el servicio desde Ajustes

### 4️⃣ Ver Estadísticas

- Navega a la pestaña "Estadísticas"
- Revisa tu racha, totales y distribución
- Identifica tus categorías más usadas

### 5️⃣ Exportar/Importar

**Exportar:**
1. Ajustes → Datos → Exportar recordatorios
2. Se crea un archivo JSON
3. Guárdalo en un lugar seguro

**Importar:**
1. Ajustes → Datos → Importar recordatorios
2. Selecciona el archivo JSON
3. Confirma la importación

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

- **Framework:** React Native 0.81 + Expo SDK 54
- **Lenguaje:** TypeScript 5.9
- **Navegación:** Expo Router 6
- **Estilos:** NativeWind 4 (Tailwind CSS)
- **Animaciones:** React Native Reanimated 4
- **Mapas:** React Native Maps + OpenStreetMap
- **Almacenamiento:** AsyncStorage
- **Geofencing:** Expo Location + Task Manager

### Servicios Externos (Gratuitos)

| Servicio | Propósito | Costo |
|----------|-----------|-------|
| OpenStreetMap | Tiles de mapa | Gratis |
| Nominatim | Búsqueda y geocodificación | Gratis |

---

## 🎨 Diseño y Branding

### Paleta de Colores

**Tema Oscuro de Lujo:**

| Color | Hex | Uso |
|-------|-----|-----|
| Verde Lujo | `#2E3F2F` | Fondo principal |
| Azul Lujo | `#1E2F4A` | Superficies |
| Dorado Premium | `#C9A24D` | Acentos y primarios |
| Rojo Lujo | `#6B1E1E` | Alertas y prioridad alta |
| Púrpura Lujo | `#4A2B5F` | Elementos secundarios |

### Tipografía

- **Sistema:** San Francisco (iOS) / Roboto (Android)
- **Tamaños:** 12px (small) → 32px (headings)
- **Pesos:** Regular (400), Semibold (600), Bold (700)

---

## 📚 Documentación Legal

- [Términos y Condiciones](./TERMS_OF_SERVICE.md)
- [Política de Privacidad](./PRIVACY_POLICY.md)

---

## 🐛 Reporte de Bugs y Soporte

### Reportar un Bug

1. Ve a [Issues](https://github.com/Diego-20000/Nexus-ig-analyzer/issues)
2. Haz clic en "New Issue"
3. Describe el problema con:
   - Descripción detallada
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots (si aplica)
   - Versión de Android y de la app

### Contacto Directo

- **Email:** nexusappestudio@gmail.com
- **GitHub:** [@Diego-20000](https://github.com/Diego-20000)

---

## 💬 FAQ

**P: ¿La app consume mucha batería?**  
R: No. Usamos geofencing nativo de Android, que es muy eficiente. El consumo es mínimo (~2-5% por día).

**P: ¿Necesito internet para usar la app?**  
R: No. Solo necesitas internet para buscar lugares. Los recordatorios funcionan offline.

**P: ¿Mis datos están seguros?**  
R: Sí. Todos los datos se almacenan localmente en tu dispositivo. No enviamos nada a servidores.

**P: ¿Por qué necesita ubicación "siempre activo"?**  
R: Para monitorear tu ubicación en segundo plano y activar recordatorios incluso cuando la app está cerrada.

**P: ¿Cuántos recordatorios puedo crear?**  
R: Ilimitados. Pero solo 20 pueden estar activos simultáneamente (limitación de Android).

**P: ¿La app es gratis?**  
R: Sí, completamente gratis y sin anuncios.

---

## 🏆 Créditos

### Desarrollado por

**NexusApp Estudio**  
*Creando experiencias móviles excepcionales*

### Tecnologías de Código Abierto

Agradecemos a los proyectos de código abierto que hacen posible esta aplicación:

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim](https://nominatim.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [NativeWind](https://www.nativewind.dev/)

---

## 📜 Licencia

© 2026 NexusApp Estudio. Todos los derechos reservados.

Este software es propietario. No está permitido:
- Redistribuir el código fuente
- Modificar o crear trabajos derivados
- Uso comercial sin autorización

Para consultas sobre licencias, contacta: nexusappestudio@gmail.com

---

<div align="center">

**¿Te gusta Recordatorios?**  
⭐ Dale una estrella en GitHub • 📢 Compártela con amigos • 💬 Déjanos tu feedback

---

Hecho con ❤️ por **NexusApp Estudio**

</div>
