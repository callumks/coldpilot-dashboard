#!/bin/bash

echo "🚀 Railway Build: Setting up database..."

# Generate Prisma client
npx prisma generate

echo "✅ Prisma client generated"

# Try to push database schema
if npx prisma db push --accept-data-loss; then
    echo "✅ Database schema created successfully!"
else
    echo "⚠️  Database schema push failed - may need manual setup"
fi

echo "🏁 Build script completed" 