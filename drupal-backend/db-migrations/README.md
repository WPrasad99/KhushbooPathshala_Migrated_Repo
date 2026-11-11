# Database Migrations — Khushboo Pathshala

This directory contains database migration scripts for production deployments and schema upgrades.

## Execution Order

1. **`001_production_hardening.sql`**:
   - Enforces relational foreign key constraints (`ON DELETE CASCADE` / `ON UPDATE CASCADE`) across all 21 `kp_*` tables.
   - Adds composite indexes for notification feeds, forum posts, forum answers, assignments, and quiz submissions.
   - Installs the `kp_migrations` tracking table to record migration state.

## How to Apply Migrations

### Local Environment (XAMPP / MySQL CLI):
```bash
# Recommended: create a backup first
mysqldump -u root khushboo_drupal > backup_before_migration.sql

# Run migration
mysql -u root khushboo_drupal < drupal-backend/db-migrations/001_production_hardening.sql
```

### Production / Docker:
```bash
docker exec -i khushboo_mariadb mysql -u $KP_DB_USER -p$KP_DB_PASS $KP_DB_NAME < drupal-backend/db-migrations/001_production_hardening.sql
```
