# services

Server-side integrations with external providers (AI models, payments, email).

Each provider sits behind a small interface so it can be swapped without
touching UI code. Modules here must start with `import "server-only";`
because they handle secret API keys.
