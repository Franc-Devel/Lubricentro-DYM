# FAUVOR Taller

Producto de FAUVOR. Identidad visual: marfil, bronce y dorado; símbolo e iconos del kit original de la marca. Se conserva la URL histórica del repositorio.

![Portada conceptual de FAUVOR Taller; no es una captura real.](assets/covers/cover.png)
### Proyecto Final de Carrera — Universidad Tecnológica Nacional (UTN)

Sistema web integral de alta disponibilidad para la administración comercial, facturación en punto de venta (POS), control de inventario físico, gestión de caja con arqueo y coordinación de turnos de taller mecánico automotriz para **Lubricentro DYM**.

Desarrollado bajo una **arquitectura desacoplada en tres capas** (Frontend SPA en **React + Vite**, Backend API REST en **Node.js + Express** y persistencia relacional transaccional en **SQLite** con motor de alta concurrencia en **modo WAL**).

---

## 👥 Equipo de Desarrollo y Roles Académicos (UTN)

El proyecto cuenta con una carga técnica de programación rigurosamente equitativa (**101 Story Points y 33.3% del esfuerzo** por integrante, totalizando **89 Historias de Usuario, 303 Story Points y 400 horas estimadas**), combinada con las funciones formales de coordinación metodológica:

| Integrante | Rol Técnico & Metodológico | Módulos Principales a Cargo | Historias / Esfuerzo | Responsabilidades Clave de Gestión |
| :--- | :--- | :--- | :---: | :--- |
| **Francisco Delgado** | **Desarrollador, QA Lead & Scrum Master** | • Acceso, Sesiones y Navegación<br>• Punto de Venta (Carrito, Cobro, Ticket)<br>• Cajas y Arqueo (Apertura y Cierre)<br>• Historial de Ventas y Anulaciones<br>• Panel de Administración de Usuarios | **31 HUs**<br>(101 pts / 132 h) | • **Liderazgo de Calidad (QA Lead):** Diseño y ejecución de la suite de pruebas bajo norma internacional **IEEE 829** (casos de borde, transaccionales y seguridad).<br>• **Facilitación Ágil (Scrum Master):** Planificación de los 4 Sprints, Burndown chart, control de dependencias y desbloqueos.<br>• **Coautor del Manual Técnico:** Capítulos de calidad y pruebas, arquitectura cliente React y manual de usuario. |
| **Sofia Cequi** | **Desarrolladora & Líder Técnico (Tech Lead)** | • Arquitectura Backend y Ruteo Express<br>• Persistencia SQLite WAL y Transacciones<br>• Seguridad, Criptografía y JWT<br>• Agenda de Turnos y Taller Mecánico<br>• CRM Clientes con Cifrado de Datos<br>• Métricas y Dashboard Ejecutivo | **29 HUs**<br>(101 pts / 134 h) | • **Líder Técnico & Arquitectura:** Diseño de base de datos física en 3FN, middlewares de seguridad, sanitización contra inyección SQL y transacciones ACID.<br>• **Gobernanza Git & Code Review:** Revisión y aprobación obligatoria de todos los Pull Requests hacia la rama `desarrollador`.<br>• **Coautora del Manual Técnico:** Capítulos de arquitectura C4, modelo relacional DER y servicios backend. |
| **Oriana Gordillo** | **Desarrolladora & Coordinadora Funcional** | • Catálogo de Productos e Inventario Físico<br>• Control de Stock Crítico y Mínimos<br>• Guía Técnica Vehicular de Lubricantes<br>• Padrón de Proveedores y Compras<br>• Contratos de Datos para la API REST | **29 HUs**<br>(101 pts / 134 h) | • **Coordinación Funcional:** Análisis y formalización de los contratos de datos de la API REST y reglas de negocio automotriz.<br>• **Catálogo Técnico Automotriz:** Normalización de fichas de vehículos, viscosidades y códigos de equivalencia de filtros.<br>• **Coautora del Manual Técnico:** Capítulos de catálogo técnico, diccionario de datos y manuales operativos. |

---

## ⚙️ ¿Cómo Funciona el Sistema? (Flujo Operativo Integral)

El sistema resuelve la operatoria diaria del lubricentro conectando en tiempo real las operaciones de mostrador con el inventario de depósito y la fosa de servicio mecánico:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   OPERATORIA DIARIA                                    │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ 1. APERTURA DE CAJA ]                     [ 2. TALLER Y TURNOS ]
             • Selección de terminal                     • Consulta de agenda
             • Registro de fondo inicial                 • Ficha técnica del vehículo
             • Habilitación del turno POS                • Asignación de mecánico y fosa
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                  [ 3. PUNTO DE VENTA (POS) ]
                                  • Búsqueda por código o descripción
                                  • Validación en vivo de stock disponible
                                  • Asociación de cliente y patente vehicular
                                  • Aplicación de promociones y descuentos
                                             │
                                             ▼
                                     [ 4. FACTURACIÓN ]
                                     • Cobro: Efectivo (vuelto aut.), Débito, Crédito
                                     • Transacción SQLite ACID atómica
                                     • Descuento automático del inventario
                                     • Emisión e impresión de ticket térmico 80mm
                                             │
                                             ▼
                                   [ 5. CIERRE Y ARQUEO ]
                                   • Arqueo físico a ciegas (conteo real)
                                   • Comparación con efectivo esperado del sistema
                                   • Identificación de sobrantes / faltantes
                                   • Reporte gerencial en Dashboard
```

---

## 📦 Módulos Funcionales Detallados

### 1. 🔐 Acceso, Sesión y Control de Roles (RBAC)
* Formulario de autenticación seguro con hashing criptográfico de contraseñas.
* Validación estricta de estado de cuenta (impide el acceso a usuarios inactivos).
* Selección obligatoria de terminal o punto de atención (`Caja_1`, `Caja_Admin`) para trazabilidad de cobros.
* Menú y navegación dinámica filtrada según el rol del usuario (`admin`, `vendedor`, `cajero`, `mecanico`).

### 2. 🧾 Terminal Punto de Venta (POS) y Carrito Interactivo
* **Buscador en Tiempo Real:** Búsqueda predictiva con *debouncing* por código de barras, nombre o categoría.
* **Carrito Reactivo:** Modificación ágil de cantidades, eliminación de ítems y cálculo automático de subtotales.
* **Blindaje de Existencias:** Bloqueo visual y rechazo a nivel backend si la cantidad solicitada supera el stock físico.
* **Venta Multimétodo:** Admite Efectivo, Tarjeta de Débito, Tarjeta de Crédito y Transferencia Bancaria.
* **Calculadora de Vuelto:** Ingreso de efectivo recibido con cálculo automático del vuelto en vivo; bloquea confirmación con importe insuficiente.
* **Ticket Térmico (80mm):** Impresión formateada con reglas CSS `@media print` que ocultan la barra lateral y menús, emitiendo un ticket limpio para impresora de mostrador.

### 3. 📦 Catálogo de Productos y Control de Inventario
* Administración centralizada del padrón de artículos (aceites sueltos, bidones, aditivos, baterías y filtros).
* Detección y filtrado con un clic de **Stock Crítico** (`stock <= stock_minimo`) para compras urgentes.
* Operaciones CRUD con **Baja Lógica** (*Soft Delete*): los artículos dados de baja no se eliminan físicamente para no romper la integridad de las ventas históricas.
* Clasificación por marcas oficiales (Motul, Total, Castrol, Elaion, WEGA, MANN Filter, FRAM).

### 4. 👥 CRM de Clientes y Parque Vehicular
* Directorio relacional con búsqueda cruzada por nombre, DNI o número de patente.
* Relación 1 a N: un cliente puede tener múltiples vehículos registrados.
* **Privacidad de Datos:** Almacenamiento seguro de DNI y teléfono bajo técnicas de protección criptográfica para mitigar filtraciones no autorizadas.
* Historial de atenciones: consulta cronológica de los servicios y lubricantes cargados a cada patente.

### 5. 🚗 Guía Técnica de Lubricación y Filtros por Modelo
* Base técnica con más de 100 fichas de vehículos nacionales e importados (Hilux, Gol Trend, Ranger, Cronos, Amarok, etc.).
* Especificación exacta de:
  * Viscosidad y norma recomendada por fabricante (ej: `5W30 Sintético — PSA B71 2290`).
  * Capacidad total del cárter en litros con reemplazo de filtro.
  * Códigos equivalentes de filtro de aceite, aire, combustible y habitáculo.

### 6. 📅 Agenda de Turnos de Taller y Fosas
* Organización visual de citas con estados: `Pendiente` (amarillo), `En Proceso` (azul), `Completado` (verde) y `Cancelado` (rojo).
* **Prevención de Colisiones Horarias:** Validación en base de datos que impide agendar dos vehículos en la misma fosa en slots superpuestos.
* Asignación de mecánico responsable y checklist técnico de tareas a realizar.

### 7. 💵 Control de Caja, Movimientos y Arqueo Diario
* **Apertura de Caja:** Precondición indispensable para facturar; registra operador, terminal y fondo inicial de cambio.
* **Control de Flujo:** Cálculo dinámico del efectivo esperado en caja:
  $$\text{Efectivo Esperado} = \text{Apertura} + \sum \text{Ventas en Efectivo} + \sum \text{Ingresos} - \sum \text{Egresos}$$
* **Arqueo y Cierre:** Formulario de conteo físico ciego; el sistema compara lo contado contra el teórico e informa discrepancias (sobrante o faltante auditado).

### 8. 🕓 Auditoría de Ventas y Anulaciones
* Registro histórico de operaciones paginadas con desglose modal de artículos comercializados.
* Reimpresión idéntica del ticket original en cualquier momento.
* **Anulación Segura:** Restringida exclusivamente al perfil de Administrador; cambia el estado de la venta a "Anulada" y reincorpora automáticamente las unidades devueltas al inventario físico.

### 9. 📊 Panel Ejecutivo (Dashboard KPIs)
* Indicadores clave en tiempo real: Facturación acumulada del día, cantidad de tickets cobrados, artículos bajo stock crítico y tamaño del catálogo.
* Gráfico interactivo de barras con la recaudación diaria de los últimos 7 días.
* Ranking de los 5 productos con mayor rotación comercial.

### 10. 🛡️ Administración, Compras y Auditoría
* Módulo de compras a proveedores con incremento automático del stock al registrar la factura de compra.
* Padrón de usuarios del sistema con activación/desactivación y reseteo forzado de contraseñas.
* Registro de auditoría inmutable de eventos críticos (aperturas, cierres, anulaciones y cambios de clave).

---

## 🏛️ Arquitectura y Tecnologías Empleadas

El proyecto implementa una arquitectura desacoplada basada en estándares web modernos:

```
┌────────────────────────────────────────────────────────┐
│             CAPA DE PRESENTACIÓN (CLIENTE)             │
│   • React 18 (SPA) + Vite                              │
│   • Vanilla CSS con Custom Properties (Dark Búnker)    │
│   • Lucide React (Iconografía técnica)                 │
│   • Context API (AuthContext) para estado de sesión   │
└───────────────────────────┬────────────────────────────┘
                            │ Peticiones HTTP / JSON REST
                            ▼
┌────────────────────────────────────────────────────────┐
│             CAPA LÓGICA Y SERVICIOS (BACKEND)          │
│   • Node.js + Express Framework                        │
│   • Middlewares: JWT Authentication, CORS, Logger     │
│   • Servicios modulares desacoplados (services/)       │
└───────────────────────────┬────────────────────────────┘
                            │ Consultas SQL Parametrizadas
                            ▼
┌────────────────────────────────────────────────────────┐
│             CAPA DE PERSISTENCIA (DATOS)               │
│   • SQLite Relacional nativo (better-sqlite3)          │
│   • Modo WAL (Write-Ahead Logging) para concurrencia   │
│   • PRAGMA foreign_keys = ON (Integridad referencial)  │
│   • Transacciones ACID estrictas (BEGIN / COMMIT)      │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js** v18.0.0 o superior instalado.
* **npm** v9.0.0 o superior.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Franc-Devel/Lubricentro-DYM.git
cd Lubricentro-DYM
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Ejecutar en Modo Desarrollo
Inicia el frontend en Vite con recarga rápida (HMR) y el backend Express con proxy inverso:
```bash
npm run dev
```
* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:3000](http://localhost:3000)

### 4. Ejecutar en Modo Producción
Para compilar los activos estáticos y servir la aplicación completa en un único puerto:
```bash
npm run build
npm start
```
* **Aplicación Unificada:** [http://localhost:3000](http://localhost:3000)

---

## ⚡ Modo Demo / Prueba Interactivo

El sistema incorpora un entorno de evaluación interactivo preconfigurado para pruebas inmediatas:
* **Selección de Rol al Cargar/Recargar:** Al abrir o refrescar la página, el sistema consulta de inmediato cómo se desea iniciar la experiencia (👑 Administrador o 👤 Usuario Normal / Cajero) con botones de acceso directo en 1 clic.
* **Alternador Dinámico en Vivo:** Desde la barra superior (`Navbar`), el usuario puede alternar entre el rol de Administrador y Operador en tiempo real para comparar la experiencia y los permisos de cada perfil.
* **Base de Datos Completa Ficticia Incluida:** Viene acompañada de la base de datos `bunker_local.db` con más de **519 artículos de stock**, **113 ventas históricas**, clientes, turnos y catálogo técnico de equivalencias automotrices listos para usar sin necesidad de configurar nada adicional.

---

## 🔑 Credenciales de Acceso

| Rol | Usuario | Contraseña | Terminal Permitida | Permisos y Alcance |
| :--- | :---: | :---: | :---: | :--- |
| **👑 Administrador** | `admin` | `admin123` | `Caja_1` (o cualquiera) | Acceso total: Dashboard de KPIs, Panel de Administración, Arqueo de Caja, Auditoría, Gestión de Stock y Precios. (Clave maestra de creador: `omega2026`). |
| **👤 Cajero / Operador** | `cajero1` | `cajero123` | `Caja_1` | Terminal de Ventas POS, Carrito de Facturación, Agenda de Turnos de Taller, Directorio CRM de Clientes, Guía Técnica Vehicular. |
| **👤 Vendedor Mostrador** | `vendedor` | `vendedor123` | `Caja_1` | Operación de POS, búsqueda en catálogo y fichas vehiculares. |

---

## 🧪 Metodología Ágil y Control de Calidad (QA)

El proyecto se gestiona mediante un **Roadmap de 4 Sprints** de 2 semanas cada uno, con un objetivo de velocidad de ~75 Story Points por Sprint:
* **Sprint 1:** Arquitectura Base, Autenticación y Catálogo de Inventario.
* **Sprint 2:** Terminal POS, Carrito Reactivo, Cobro Multimétodo y Control de Caja.
* **Sprint 3:** CRM de Clientes, Vehículos, Agenda de Turnos de Taller y Guía de Fluidos.
* **Sprint 4:** Historial de Ventas, Anulaciones Auditadas, Dashboard Ejecutivo y Cierre de QA.

### Aseguramiento de Calidad (Norma IEEE 829)
Bajo la dirección de **Francisco Delgado (QA Lead)**, el sistema cuenta con una batería formal de casos de prueba que auditan:
1. **Flujos Felices (*Happy Path*):** Facturación, cálculo de vuelto, impresión y arqueo.
2. **Casos Borde (*Edge Cases*):** Bloqueo ante stock insuficiente, ventas con caja cerrada y faltantes de arqueo.
3. **Resistencia de Datos:** Comprobación de transacciones atómicas SQLite (rollback automático ante fallos de hardware).
4. **Seguridad OWASP:** Sanitización estricta contra inyección SQL mediante sentencias preparadas (*Prepared Statements*).

---

## 📄 Licencia y Marco Académico

Desarrollado como **Trabajo Final Integrador de Carrera** para la **Universidad Tecnológica Nacional (UTN)**.
Año 2026. Todos los derechos reservados.
