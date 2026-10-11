# 🛢️ Sistema de Gestión - LubriCenter

Proyecto desarrollado para la cátedra **Metodología de Sistemas I** (Ing. Ruth Diaz Alberti).
Este sistema integral permite la gestión de catálogo, control de stock y reserva de turnos para un lubricentro.

## 👥 Equipo de Desarrollo

- Agustín Francisco Delgado Ojeda
- Nico
- Franco

## 🏗️ Arquitectura del Proyecto

El proyecto está estructurado como un **Monorepo**, dividiendo la lógica de negocio y la interfaz de usuario en dos directorios principales:

- `/backend`: API RESTful construida con Node.js, Express y Prisma (ORM). Base de datos MySQL.
- `/frontend`: Interfaz de usuario responsiva construida con HTML5, CSS3, JavaScript Vanilla y Bootstrap 5.

## 🚀 Guía de Instalación y Ejecución Local

Para levantar este proyecto en tu computadora, asegurate de tener instalados **Node.js** y **XAMPP** (con MySQL).

### 1. Configuración de la Base de Datos

Primero, iniciá **MySQL** desde el panel de XAMPP y creá una base de datos vacía llamada `sistema_lubricentro`.

Luego, cloná este repositorio, abrí la terminal en la carpeta `/backend` e instalá las dependencias:

```bash
npm install
Por último, sincronizá el esquema de Prisma y poblá la base de datos con el catálogo inicial:

Bash
npx prisma db push
node prisma/seed.js
2. Iniciar el Servidor (Backend)
Dentro de la carpeta /backend, ejecutá el siguiente comando:

Bash
node index.js
El servidor quedará escuchando en http://localhost:3000.

3. Iniciar la Interfaz (Frontend)
Con el backend en ejecución, abrí el archivo /frontend/index.html directamente en tu navegador o utilizando la extensión Live Server de VS Code.

🌿 Flujo de Trabajo (Git Flow)
Para mantener el historial limpio y evitar conflictos de código, respetaremos el siguiente esquema de ramas:

main: Rama protegida. Solo contiene código estable y funcional (producción).

developer: Rama de integración. Todo el código nuevo llega acá antes de pasar a main.

Ramas de funcionalidad (feature/*): Para cada tarea nueva, crear una rama a partir de developer.
```
