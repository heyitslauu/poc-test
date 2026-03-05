# EMPOWERX FSDS Backend

NestJS + PostgreSQL backend service for EMPOWERX FSDS (Financial Services Database System).

## Tech Stack

- **Framework**: NestJS 11 + TypeScript
- **Database**: PostgreSQL (via `pg` / ORM tooling)
- **Validation**: `class-validator`, `class-transformer`
- **Security & HTTP**: `helmet`, `pino-http`
- **API Responses**: Standardized response formatting with Swagger integration

## Standardized API Responses

This template includes a complete API response standardization system that ensures consistent response formats across all endpoints and provides excellent Swagger/OpenAPI documentation support.

### Key Features

- **Type-Safe Status Codes**: Uses NestJS `HttpStatus` enum instead of raw numbers for better type safety and maintainability
- **Consistent Response Format**: All responses follow a standardized structure with metadata, data, and error information
- **Automatic Trace ID Generation**: Every response includes a unique trace ID for request tracking
- **Pagination Support**: Built-in support for paginated responses with metadata
- **Validation Error Handling**: Structured validation error responses with detailed field-level information
- **Swagger Integration**: Full OpenAPI/Swagger documentation support with proper type definitions

### Response Formats

All API responses follow a consistent structure:

#### Basic Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Retrieved successfully",
  "meta": {
    "traceId": "abc-123-xyz",
    "timestamp": "2023-10-27T10:05:00Z"
  },
  "data": [],
  "error": null
}
```

#### Paginated Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transactions retrieved successfully.",
  "meta": {
    "traceId": "abc-123-xyz",
    "timestamp": "2023-10-27T10:05:00Z",
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "limit": 20,
      "totalItems": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "appliedFilters": {
      "sortBy": "date",
      "sortOrder": "desc",
      "status": "active"
    }
  },
  "data": [
    { "id": 1, "amount": 500 },
    { "id": 2, "amount": 200 }
  ],
  "error": null
}
```

#### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Failed",
  "meta": {
    "traceId": "err-789-mpl",
    "timestamp": "2023-10-27T10:10:00Z"
  },
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "loanType",
        "value": "MORTGAGE",
        "issue": "loanType must be one of: CAR | PERSONAL",
        "location": "body"
      }
    ]
  }
}
```

### Usage

#### Using Static Utility Methods (Recommended)

```typescript
import { ApiResponse } from './common';

@Controller('posts')
export class PostsController {
  @Get()
  getPosts() {
    const posts = this.postService.findAll();
    return ApiResponse.success(posts);
  }

  @Post()
  createPost(@Body() createPostDto) {
    const post = this.postService.create(createPostDto);
    return ApiResponse.success(post, 'Post created successfully', 201);
  }

  @Get('paginated')
  getPaginatedPosts(@Query() query) {
    const { data, pagination } = this.postService.findPaginated(query);
    return ApiResponse.paginatedSuccess(data, pagination);
  }

  @Post('create')
  createPostWithValidation(@Body(ValidationPipe) dto) {
    try {
      const post = this.postService.create(dto);
      return ApiResponse.success(post, 'Post created successfully', 201);
    } catch (error) {
      return ApiResponse.validationError([
        {
          field: 'title',
          value: dto.title,
          issue: 'Title must be unique',
          location: 'body',
        },
      ]);
    }
  }
}
```

#### Error Handling

Validation errors are automatically formatted with custom error messages. For example:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation Failed",
  "meta": {
    "traceId": "err-789-mpl",
    "timestamp": "2023-10-27T10:10:00Z"
  },
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "value": null,
        "issue": "email must be an email",
        "location": "body"
      },
      {
        "field": "name",
        "value": null,
        "issue": "name should not be empty",
        "location": "body"
      }
    ]
  }
}
```

Errors are automatically formatted by the global exception filter. For manual error responses:

```typescript
return ApiResponse.validationError([
  {
    field: 'email',
    value: 'invalid-email',
    issue: 'Invalid email format',
    location: 'body',
  },
]);
```

#### Using Custom Decorators (Recommended)

Use the provided `ApiCustomResponse` and `ApiPaginatedResponse` decorators for automatic Swagger documentation:

```typescript
import { ApiCustomResponse, ApiPaginatedResponse } from './common/decorators/api-response.decorator';
import { ApiResponse } from './common';

@Controller('users')
export class UsersController {
  @Get()
  @ApiCustomResponse(UserDto)
  getUser() {
    const user = this.userService.findOne();
    return ApiResponse.success(user);
  }

  @Get('list')
  @ApiPaginatedResponse(UserDto, { description: 'Returns paginated users' })
  getUsers(@Query() query) {
    const { data, pagination } = this.userService.findPaginated(query);
    return ApiResponse.paginatedSuccess(data, pagination);
  }

  @Post()
  @ApiCustomResponse(UserDto, { statusCode: 201, description: 'User created successfully' })
  createUser(@Body() dto: CreateUserDto) {
    const newUser = this.userService.create(dto);
    return ApiResponse.success(newUser, 'User created successfully', HttpStatus.CREATED);
  }

  @Get(':id')
  @ApiCustomResponse(UserDto)
  getUserById(@Param('id') id: number) {
    const user = this.userService.findOne(id);
    if (!user) {
      return ApiResponse.notFound('User');
    }
    return ApiResponse.success(user);
  }
}
```

**Benefits of Custom Decorators:**

- Automatically generates correct Swagger schema with your DTO type
- Handles status code mapping to correct response decorators
- Reduces boilerplate compared to standard NestJS decorators
- Type-safe: Ensures response data matches your DTO

#### Using Standard Decorators (Fallback)

Only use standard NestJS Swagger decorators when the custom decorators don't meet your needs:

```typescript
import {
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { SuccessResponseDto, PaginationResponseDto, ErrorResponseDto } from './common';

@Controller('users')
export class UsersController {
  @Get()
  @ApiOkResponse({
    description: 'Returns user data',
    type: SuccessResponseDto,
    schema: {
      allOf: [
        { $ref: '#/components/schemas/SuccessResponseDto' },
        {
          properties: {
            data: { $ref: '#/components/schemas/UserDto' },
          },
        },
      ],
    },
  })
  getUser() {
    return ApiResponse.success(user);
  }

  @Post()
  @ApiOkResponse({
    description: 'User created successfully',
    type: SuccessResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ErrorResponseDto,
  })
  createUser(@Body() dto) {
    return ApiResponse.success(newUser, 'User created successfully', HttpStatus.CREATED);
  }
}
```

**Use standard decorators for:**

- Complex multi-status scenarios beyond create/read/paginated
- Custom error responses with specific codes
- Advanced schema requirements not covered by custom decorators

### Global Setup

The response standardization is automatically applied globally:

- **Response Interceptor**: Automatically wraps all controller responses in the standard format
- **Exception Filter**: Converts all exceptions to standardized error responses
- **Swagger Integration**: Provides proper OpenAPI documentation for all response types

### Available Methods

#### ApiResponse Methods:

- `success(data, message?, statusCode?, appliedFilters?)` - Basic success response (statusCode defaults to `HttpStatus.OK`)
- `paginatedSuccess(data, pagination, message?, statusCode?, appliedFilters?)` - Paginated response (statusCode defaults to `HttpStatus.OK`)
- `error(statusCode, message)` - Custom error response (accepts `HttpStatus`)
- `validationError(details)` - Validation error response (returns `HttpStatus.UNPROCESSABLE_ENTITY`)
- `notFound(resource?)` - 404 Not Found response (`HttpStatus.NOT_FOUND`)
- `unauthorized(message?)` - 401 Unauthorized response (`HttpStatus.UNAUTHORIZED`)
- `forbidden(message?)` - 403 Forbidden response (`HttpStatus.FORBIDDEN`)
- `conflict(message?)` - 409 Conflict response (`HttpStatus.CONFLICT`)
- `badRequest(message?)` - 400 Bad Request response (`HttpStatus.BAD_REQUEST`)
- `internalServerError(message?)` - 500 Internal Server Error response (`HttpStatus.INTERNAL_SERVER_ERROR`)

#### Helper Utilities:

- `createMeta(pagination?, appliedFilters?)` - Create meta object
- `createPaginationMeta(...)` - Create pagination metadata
- `generateTraceId()` - Generate unique trace ID
- `getCurrentTimestamp()` - Get ISO timestamp

### Using HttpStatus Enum

All status codes throughout the response system use NestJS's `HttpStatus` enum for type safety:

```typescript
import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from './common';

// With HttpStatus enum
return ApiResponse.success(data, 'Created successfully', HttpStatus.CREATED);
return ApiResponse.error(HttpStatus.CONFLICT, 'Resource already exists');

// Default HttpStatus.OK is used if statusCode is not specified
return ApiResponse.success(data); // Uses HttpStatus.OK by default
return ApiResponse.paginatedSuccess(data, pagination); // Uses HttpStatus.OK by default
```

**Benefits:**

- Type-safe: Prevents invalid status codes
- Self-documenting: Clear intent with enum names instead of magic numbers
- IDE support: Auto-completion and jump-to-definition for all HTTP status codes

### Example Endpoints

See `src/example/example.controller.ts` for complete usage examples. You can test these endpoints at:

- `GET /example/success` - Basic success response
- `GET /example/paginated?page=1&limit=10` - Paginated response
- `POST /example/create` - Create with validation
- `GET /example/error` - Error response example

## Prerequisites

- **Node.js**: Recent LTS (e.g. 18+)
- **Package manager**: `pnpm` recommended (this repo includes a `pnpm-lock.yaml`). Install it first with `npm install -g pnpm` or follow the [official installation guide](https://pnpm.io/installation).
- **Docker & Docker Compose v2+**: Required to run the local Postgres instance defined in `compose.yaml`.

## Environment Configuration

1.  Copy the example env file:

    ```bash
    cp .env.example .env
    ```

    On Windows (PowerShell):

    ```powershell
    Copy-Item .env.example .env
    ```

2.  Open `.env` and review/update values. The most relevant ones for the database are:
    - `POSTGRES_HOST`
    - `POSTGRES_USER`
    - `POSTGRES_PASSWORD`
    - `POSTGRES_DB`
    - `POSTGRES_PORT`

    See `.env.example` for detailed comments on each variable.

## Database (PostgreSQL) via Docker Compose

This project includes a `compose.yaml` file that starts a PostgreSQL database in Docker.

### What `compose.yaml` provides

- **Service**: `postgres`
- **Image**: `postgres:18-alpine`
- **Environment variables** (taken from your shell / `.env`):
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
- **Port mapping**:
  - Host: `${POSTGRES_PORT-5432}` ↔ Container: `5432`
- **Volume**:
  - `postgres_data:/var/lib/postgresql/data` (persists your data between container restarts)
- **Healthcheck**:
  - Uses `pg_isready` to wait until the database is up and accepting connections.

### Starting Postgres with Docker Compose

From the backend project root (where `compose.yaml` lives):

```bash
docker compose -f compose.yaml up -d
```

This will:

- Pull the `postgres:18-alpine` image (if not already present).
- Start the `postgres` container in the background.
- Create/use the `postgres_data` volume to persist data.

Once the healthcheck passes, the database will be ready to accept connections.

### Stopping Postgres

To stop the database container (but keep data in the volume):

```bash
docker compose -f compose.yaml down
```

To **remove data as well** (reset the database):

```bash
docker compose -f compose.yaml down -v
```

> **Warning**: The `-v` flag deletes the `postgres_data` volume and all stored data.

### Connecting the Backend to the Dockerized Postgres

- Ensure the same `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT` values are used by both:
  - `compose.yaml` (via environment variables)
  - Your NestJS app (via `.env`)
- When running the NestJS app **on your host machine** with Postgres in Docker, you will typically connect via:
  - `POSTGRES_HOST=localhost` (or `127.0.0.1`)
  - `POSTGRES_PORT=5432` (or whatever you configured in `.env`)

Refer to `.env.example` for more guidance on host vs. container networking.

## Running the Backend in Local Development

1.  Install dependencies:

    ```bash
    pnpm install
    ```

2.  Start Postgres via Docker Compose (if you are using the local container):

    ```bash
    docker compose -f compose.yaml up -d
    ```

3.  Start the NestJS development server (with file watching):

    ```bash
    pnpm start:dev
    ```

The app will start using the configuration from `.env`.

## Building and Running in Production Mode

1.  Build the project:

    ```bash
    pnpm build
    ```

2.  Run the compiled app:

    ```bash
    pnpm start:prod
    ```

In production, you can either:

- Continue using the provided `compose.yaml` for Postgres with stronger credentials, **or**
- Point the app to an externally managed PostgreSQL instance by adjusting the `POSTGRES_*` variables.

## Available Scripts

All scripts can be run with `pnpm <script>`. If you use npm, replace `pnpm` with `npm run`.

- **`pnpm start`**
  - Starts the NestJS app in normal mode.

- **`pnpm start:dev`**
  - Starts the NestJS app in watch mode (auto-reload on code changes).

- **`pnpm start:debug`**
  - Starts the app in debug + watch mode.

- **`pnpm start:prod`**
  - Runs the compiled app from `dist/main`.

- **`pnpm build`**
  - Builds the app using the Nest CLI (`nest build`).

- **`pnpm lint`**
  - Runs ESLint across `src`, `apps`, `libs`, and `test`.

- **`pnpm format`**
  - Formats source and test files with Prettier.

- **`pnpm test` / `pnpm test:watch` / `pnpm test:cov` / `pnpm test:e2e`**
  - Run unit tests, watch mode, coverage, and e2e tests respectively.

## Recommended Workflow

- **During development**:

  ```bash
  docker compose -f compose.yaml up -d   # start Postgres
  pnpm start:dev                         # start NestJS in watch mode
  ```

- **Before pushing changes**:

  ```bash
  pnpm lint
  pnpm format
  pnpm test
  pnpm build
  ```

- **To reset the local database completely**:

  ```bash
  docker compose -f compose.yaml down -v
  docker compose -f compose.yaml up -d
  ```
