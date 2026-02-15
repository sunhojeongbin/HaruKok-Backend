process.env.NODE_ENV = 'test';
process.env.SKIP_DB = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
