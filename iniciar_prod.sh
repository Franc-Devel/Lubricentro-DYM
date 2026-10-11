#!/usr/bin/env bash
set -e

# Cambiar al directorio del script
cd "$(dirname "$0")"

echo "======================================================="
echo "   📦 Lubricentro DYM - Modo Producción (Servidor Unificado)"
echo "======================================================="
echo "Compilando interfaz web si es necesario..."
npm run build

echo "Iniciando servidor en http://localhost:3000..."
npm start
