# CAI LMM Sales Dashboard

Staff use this dashboard to register prospects, record vehicle requirements and manage follow-ups. The registration screen retains the layout, labels, colours, choices and interactions from `../CAI_LMM_Single_Screen_Dashboard.html`. The project uses Laravel MVC, Blade, vanilla JavaScript and MySQL.

## Requirements

- PHP 8.2 or later with `pdo_mysql` and the standard Laravel extensions
- Composer 2
- MySQL 8

The installed PHP 8.2.12, Composer 2.10.3 and MySQL 8.0.45 were checked before choosing Laravel 12. Composer installs the PHP dependencies. The app serves frontend assets directly from `public/assets`. [Laravel 12 server requirements](https://laravel.com/docs/12.x/deployment#server-requirements)

## Install and run locally

If `.local/mysql/my.ini` exists, use the project-local MySQL instructions below.

Run the commands from the workspace root in PowerShell.

```powershell
cd cai-lmm
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
```

On macOS or Linux, use `cp -n .env.example .env` to create the environment file. Generate the application key once for each new installation.

Start MySQL. On this Windows installation the service is named `MySQL80`. From an elevated PowerShell session, you can start it with `Start-Service MySQL80`. Open MySQL as a database administrator to provision a dedicated schema and account.

```powershell
mysql -u root -p
```

Replace the password below with a strong unique password before running the SQL.

```sql
CREATE DATABASE cai_lmm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cai_lmm'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON cai_lmm.* TO 'cai_lmm'@'localhost';
```

Set the connection values in `.env`. Adjust the host, port, database and username for your installation.

```dotenv
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=Asia/Kolkata
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cai_lmm
DB_USERNAME=cai_lmm
DB_PASSWORD="REPLACE_WITH_YOUR_DATABASE_PASSWORD"
```

Create the schema, seed the dropdowns and radio groups, and create your first staff login. The command prompts for the staff email and a password of at least eight characters.

```powershell
php artisan migrate --seed
php artisan staff:create
php artisan serve --host=127.0.0.1 --port=8000
```

Visit [the local dashboard](http://127.0.0.1:8000) and sign in. Use **Registered leads** to view, edit or delete customer records. `php artisan db:seed` can be rerun to restore the prototype choices and their order.

If Laravel reports a MySQL connection error, check that MySQL is running and verify the configured connection with `mysql -h 127.0.0.1 -P 3306 -u cai_lmm -p cai_lmm`. If a previous deployment cached configuration, run `php artisan config:clear` after editing `.env`.

For production, set `APP_ENV=production`, `APP_DEBUG=false`, the HTTPS `APP_URL` and `SESSION_SECURE_COOKIE=true`. Set the web server's document root to `public/` and give the PHP process write access to `storage/` and `bootstrap/cache/`. Keep `.env` private.

## Project-local MySQL on Windows

The local Laravel `.env` uses the project’s MySQL 8 instance at `127.0.0.1:3306`. Keep XAMPP MariaDB and the `MySQL80` service stopped while the project uses this port. Data, configuration, and the administrator password are under the ignored `.local/mysql/` directory. Start the project MySQL process manually after a reboot.

To restart the provisioned instance, run this from `cai-lmm/` in PowerShell.

```powershell
$mysqlConfig = (Resolve-Path -LiteralPath '.local/mysql/my.ini').Path
Start-Process -FilePath 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe' -ArgumentList ('--defaults-file="{0}"' -f $mysqlConfig) -WindowStyle Hidden
```

Run `php artisan migrate:status` to confirm Laravel can connect. For a graceful shutdown, run `mysqladmin --protocol=TCP -h 127.0.0.1 -P 3306 -u root -p shutdown` and enter the project-local administrator password stored in `.local/mysql/root-password.txt`.

## REST API

The dashboard uses authenticated same-origin JSON endpoints. Sign in through `/login` and retain the Laravel session cookie. Include `Accept: application/json`. Send JSON request bodies and the dashboard's `X-CSRF-TOKEN` header for write requests.

| Method | Path | Success |
| --- | --- | --- |
| GET | `/api/lead-options` | `200`, options grouped by form field. `scope` identifies the application for hotspots and models. |
| GET | `/api/leads?page=1` | `200`, 15 leads per page, newest first, with pagination metadata. |
| POST | `/api/leads` | `201`, created lead and `Location` header. |
| GET | `/api/leads/{id}` | `200`, complete lead details. |
| PUT | `/api/leads/{id}` | `200`, full replacement of the lead. Omitted optional fields are cleared. |
| DELETE | `/api/leads/{id}` | `204`, lead deleted. |

JSON successes use a `data` key except `204`. Validation errors return `422` with an `errors` object keyed by the original form names. Missing authentication returns `401`, missing leads return `404`, and failed CSRF checks return `419`.

## Business rules and assumptions

- Customer registration creates one lead record containing all 18 prototype fields. Repeat enquiries from the same mobile number or email may be registered separately.
- Company and Logistics require a company name. Individual hides and clears that field. Passenger and Cargo each have their own required hotspot and recommended model. Vehicle category, current vehicle, exchange, test drive and finance retain their original independent choices.
- New and rescheduled follow-ups must be dated today or later, using `APP_TIMEZONE`. Editing a lead may retain its existing overdue date.
- Staff accounts are provisioned by `staff:create`. All signed-in staff share access to the leads workspace. The seed produces only the option catalog. Deletion is permanent and requires confirmation in the dashboard.
- The backend applies storage limits of 255 characters for names and locations, 254 for email and 5,000 for remarks. The prototype's 10-digit Indian mobile format is enforced on both the form and the API.

## Test

```powershell
php artisan test
```

The default suite uses in-memory SQLite through `pdo_sqlite` for local feedback. To run the same suite against MySQL, provision a **dedicated empty** schema ending in `_test` and give its database user access. The suite rebuilds the test schema. Set these variables in a separate PowerShell session, using the test account's credentials.

```powershell
$env:DB_CONNECTION = 'mysql'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_DATABASE = 'cai_lmm_test'
$env:DB_USERNAME = 'cai_lmm_test'
$testPassword = Read-Host 'MySQL test password' -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $testPassword).Password
php artisan test
```

Coverage includes staff sign-in, seeded and database-driven choices, conditional validation, all CRUD endpoints, overdue follow-up handling and pagination. For a browser check, sign in and create a lead, switch business and application types, verify the saved details and copy action, then view, edit and delete that lead from **Registered leads**.

