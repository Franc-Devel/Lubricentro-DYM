# 🛢️ Lubricentro DyM | Sistema de Gestión

Sistema integral para la administración de un lubricentro, desarrollado como proyecto académico para la cátedra **Metodología de Sistemas I**.

Permite gestionar productos, controlar el stock disponible y administrar reservas de turnos mediante una interfaz intuitiva y una API REST escalable.

---

## 👨‍💻 Desarrolladores

* **Francisco Delgado**
* **Oriana Gordillo**

---

## 📋 Funcionalidades

### 🛒 Gestión de Productos

* Alta, baja y modificación de productos.
* Visualización completa del catálogo.
* Organización por categorías.

### 📦 Control de Stock

* Registro y actualización de existencias.
* Control de disponibilidad de productos.
* Gestión eficiente del inventario.

### 📅 Gestión de Turnos

* Reserva de turnos para servicios.
* Consulta de disponibilidad.
* Administración de reservas.

### 🔐 Arquitectura Escalable

* API REST desarrollada con Express.
* Persistencia de datos mediante Prisma ORM.
* Base de datos MySQL.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura **Monorepo**, separando claramente el backend y el frontend.

```text
Lubricentro-DYM/
│
├── backend/
│   ├── prisma/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── index.js
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── index.html
│
└── README.md
```

### Backend

Tecnologías utilizadas:

* Node.js
* Express.js
* Prisma ORM
* MySQL

### Frontend

Tecnologías utilizadas:

* HTML5
* CSS3
* JavaScript (Vanilla)
* Bootstrap 5

---

## 🚀 Instalación y Ejecución

### Requisitos Previos

Antes de comenzar, asegurate de tener instalado:

* Node.js
* XAMPP (MySQL)
* Git

---

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/Franc-Devel/Lubricentro-DYM.git
cd Lubricentro-DYM
```

---

### 2️⃣ Configurar la Base de Datos

Iniciar MySQL desde XAMPP y crear una base de datos vacía llamada:

```sql
sistema_lubricentro
```

Ingresar al directorio backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Sincronizar Prisma con la base de datos:

```bash
npx prisma db push
```

Cargar datos iniciales:

```bash
node prisma/seed.js
```

---

### 3️⃣ Iniciar el Backend

Desde la carpeta backend:

```bash
node index.js
```

Servidor disponible en:

```text
http://localhost:3000
```

---

### 4️⃣ Iniciar el Frontend

Abrir:

```text
/frontend/index.html
```

o ejecutar mediante la extensión **Live Server** de Visual Studio Code.

---

## 🌿 Flujo de Trabajo Git

Para mantener una correcta organización del proyecto se utilizará una estrategia basada en Git Flow.

### Ramas principales

| Rama      | Descripción                                   |
| --------- | --------------------------------------------- |
| main      | Versión estable del proyecto                  |
| developer | Rama de integración de nuevas funcionalidades |

### Ramas de funcionalidad

```text
feature/nombre-funcionalidad
```

Crear una nueva rama:

```bash
git checkout developer
git pull origin developer
git checkout -b feature/nombre-funcionalidad
```

Una vez finalizada la tarea:

```bash
git add .
git commit -m "feat: descripción de la funcionalidad"
git push origin feature/nombre-funcionalidad
```

Posteriormente se realizará la revisión correspondiente antes de integrarla a `developer`.

---

## 📚 Metodología de Desarrollo

Este proyecto se desarrolla aplicando conceptos de:

* Ingeniería de Software
* Scrum
* Git Flow
* Metodología de Sistemas I

---

## 📄 Licencia

Proyecto desarrollado con fines académicos para la carrera de Ingeniería en Sistemas.
