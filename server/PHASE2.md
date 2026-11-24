# ALANKRITA Phase 2

## Configure and run

Use MongoDB Atlas or a local MongoDB replica set. Product writes and category deletion use transactions, which require a replica set or sharded cluster.

1. Stop any running ALANKRITA dev servers with Ctrl+C in their terminals, then run `npm ci` from the repository root. On Windows, running dev servers can lock files that `npm ci` replaces. If `server/.env` already exists, keep it and add missing keys from `server/.env.example`.
2. In `server/.env`, set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The password needs at least 12 characters and can use up to 72 UTF-8 bytes. Generate a JWT secret locally with `node -p "require('node:crypto').randomBytes(32).toString('hex')"` and paste it into the server environment file.
3. Run `npm run seed:admin --workspace server`. It creates the single administrator or updates the existing credentials and invalidates previously issued tokens.
4. Run `npm run dev:server`. The API is at `http://localhost:5000/api` with the default port.

## API routes

All responses use `{ success, data, message }`. Admin routes after login require `Authorization: Bearer <token>`. Keep the token in process memory when testing. Set `Content-Type: application/json` on requests with a JSON body.

| Method and route under `/api` | What it does |
| --- | --- |
| `GET /health` | Reports HTTP liveness and MongoDB connection state |
| `GET /products` | Lists published products with pagination |
| `GET /products/:slug` | Returns one published product, including sold-out items |
| `GET /categories` | Lists categories by order and name |
| `GET /settings` | Reads the public site settings, with original brand defaults |
| `POST /admin/login` | Accepts `email` and `password` and returns an expiring JWT |
| `GET /admin/stats` | Counts all products, including drafts, by stock status and featured flag |
| `GET /admin/products`, `GET /admin/products/:id` | Lists and reads products, including drafts |
| `POST /admin/products`, `PUT /admin/products/:id`, `DELETE /admin/products/:id` | Creates, updates and deletes products |
| `GET /admin/categories`, `POST /admin/categories`, `PUT /admin/categories/:id`, `DELETE /admin/categories/:id` | Reads and manages categories |
| `GET /admin/settings`, `PUT /admin/settings` | Reads and updates the single editable settings document |

### Products and categories

Create a category with `name` and optional `slug`, `description`, `order`, and `image`. Create a product with `name`, the category's MongoDB ID as `category`, `occasion` (`daily`, `party`, `bridal`, or `festive`), and numeric `price`. Optional fields match the [Product model](models/Product.js). A supplied `originalPrice` must exceed `price`. Send `originalPrice: null` to remove it.

Names generate slugs on creation. Edits preserve the link unless you explicitly send a new slug. A missing product code is generated and identifiers with unique-value collisions return HTTP 409. Products start as drafts. Send `published: true` to make a product visible. Send only the fields you want to change on `PUT`.

List filters include `category` (slug or ObjectId), `occasion`, `minPrice`, `maxPrice`, `color`, `stock`, `combo`, `featured`, `search`, `sort`, `page` and `limit`. Admin lists also accept `published=true` or `published=false`. Search matches a literal substring across name, code, description, and category. Sort values are `newest` (default), `price_asc` and `price_desc`. Pages start at 1 and `limit` defaults to 12, with a maximum of 50. Responses return `items`, `page`, `limit`, `total` and `totalPages`.

Image metadata uses `{ url, publicId }` and HTTPS URLs. The first image is primary. Empty product image arrays are allowed while preparing drafts. Public responses omit the image management identifier. A category in use returns HTTP 409 on deletion. Reassign or delete its products first.

### Site settings

Send the fields to update in the settings body. See [the defaults](config/siteDefaults.js) for the supported keys. FAQ items use `{ question, answer }`, trust items are strings, and the hero image uses the same image metadata shape as categories. Use `null` to clear an optional category or hero image.

## Run the tests

```powershell
npm test --workspace server
```

To also run the MongoDB integration test, set `TEST_MONGODB_URI` in the terminal to a replica-set URI for a test cluster. The database user must be able to create and drop a uniquely named temporary database. Then run the same test command. The test creates its own isolated database and removes it after the run. It checks login and token invalidation, draft visibility, filtering, settings, and category deletion while a product is being created.

For a manual login, after running the seed command, set your admin email and password in your current PowerShell environment and run:

```powershell
$apiUrl = 'http://localhost:5000/api'
$loginBody = @{email=$env:ADMIN_EMAIL; password=$env:ADMIN_PASSWORD} | ConvertTo-Json
$loginResult = Invoke-RestMethod "$apiUrl/admin/login" -Method Post -ContentType 'application/json' -Body $loginBody
$adminHeaders = @{Authorization="Bearer $($loginResult.data.token)"}
Invoke-RestMethod "$apiUrl/admin/stats" -Headers $adminHeaders
Invoke-RestMethod "$apiUrl/products"
```

## Code map

- [Models](models) define documents, indexes and the single admin and settings identifiers.
- [Routes](routes/catalogueRoutes.js) connect URLs to validators, the auth guard and controllers.
- [Validator rules](routes/validators.js) accept only known fields before controllers construct MongoDB queries.
- [Controllers](controllers) implement the catalogue operations, defaults and login.
- [Authorization](middleware/auth.js) verifies JWT signatures, lifetime and the current admin credential version.
- [Admin seed](seed/createAdmin.js) hashes the password before writing the administrator record.

## Interview angle

1. **Why use bcrypt before storing the password?** Bcrypt uses a per-password salt and an adjustable work factor. The server stores the resulting hash and verifies submitted passwords with `bcrypt.compare`.
2. **How does rerunning the seed command invalidate existing JWTs?** The seed rotates a credential version in MongoDB, and the auth middleware compares every verified token's version with the current value. An old token fails authorization even before it expires.
3. **Why do product assignment and category deletion both write to the category inside a transaction?** That shared write makes concurrent operations conflict. When the database retries, assignment sees a deleted category or deletion sees the newly linked product.
