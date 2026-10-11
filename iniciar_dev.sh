#!/usr/bin/env bash
set -e

# Cambiar al directorio del script
cd "$(dirname "$0")"

echo "======================================================="
echo "   🚀 Lubricentro DYM - Modo Desarrollo (HMR + API)    "
echo "======================================================="
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:3000"
echo "======================================================="

npm run dev
