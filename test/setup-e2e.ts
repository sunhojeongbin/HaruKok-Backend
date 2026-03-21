process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
process.env.AUTH_FALLBACK_ENABLED = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
