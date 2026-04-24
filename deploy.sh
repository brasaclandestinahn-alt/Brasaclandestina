#!/bin/bash
set -e  # detiene si cualquier comando falla

BRANCH="feature/dark-kitchen-redesign"
MSG=${1:-"chore: update"}

echo "📦 Agregando cambios..."
git add .

echo "💾 Haciendo commit..."
git commit -m "$MSG"

echo "⬆️ Push a $BRANCH..."
git push origin $BRANCH

echo "🔀 Cambiando a main..."
git checkout main

echo "⬇️ Pull de main..."
git pull origin main

echo "🔗 Mergeando $BRANCH..."
git merge --no-ff $BRANCH -m "merge: $MSG"

echo "⬆️ Push a main..."
git push origin main

echo "🔙 Regresando a $BRANCH..."
git checkout $BRANCH

echo "✅ Deploy completado exitosamente"
