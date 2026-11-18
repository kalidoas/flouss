import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeOtpHmac } from '../src/otp.js';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(), updateUser: vi.fn(), getAdminAuth: vi.fn(),
  getAdminFirestore: vi.fn(), getFirebaseAdminApp: vi.fn(), sendWithResend: vi.fn(),
}));
vi.mock('../src/firebase.js', () => ({
  getAdminAuth: mocks.getAdminAuth,
  getAdminFirestore: mocks.getAdminFirestore,
  getFirebaseAdminApp: mocks.getFirebaseAdminApp,
  verifyAuthHeader: async (req: { headers: { authorization?: string } }) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ') || !header.slice(7).trim()) {
      throw Object.assign(new Error('missing token'), { status: 401 });
    }
    const decoded = await mocks.verifyIdToken(header.slice(7).trim());
    return { uid: decoded.uid, email: decoded.email || '' };
  },
}));
vi.mock('../src/resend.js', () => ({ sendWithResend: mocks.sendWithResend }));

const secret = 'test-only-otp-secret-with-at-least-32-bytes';
const tokenUid = 'verified-token-user';
let app: (typeof import('../src/index.js'))['app'];
let firestore: ReturnType<typeof createFirestore>;
let documents: Map<string, Record<string, unknown>>;
let docCalls: Array<[string, string]>;

function createFirestore() {
  documents = new Map();
  docCalls = [];
  const key = (collection: string, id: string) => `${collection}/${id}`;
  const refFor = (collection: string, id: string) => {
    docCalls.push([collection, id]);
    return {
      get: vi.fn(async () => {
        const value = documents.get(key(collection, id));
        return { exists: value !== undefined, data: () => value };
      }),
      set: vi.fn(async (value: Record<string, unknown>) => {
        documents.set(key(collection, id), { ...(documents.get(key(collection, id)) ?? {}), ...value });
      }),
      update: vi.fn(async (value: Record<string, unknown>) => {
        const current = documents.get(key(collection, id));
        if (!current) throw new Error('document missing');
        documents.set(key(collection, id), { ...current, ...value });
      }),
      delete: vi.fn(async () => { documents.delete(key(collection, id)); }),
      collection: vi.fn((child: string) => ({ doc: (childId: string) => refFor(`${collection}/${id}/${child}`, childId) })),
    };
  };
  return {
    collection: vi.fn((name: string) => ({ doc: (id: string) => refFor(name, id) })),
    runTransaction: vi.fn(async (callback: (transaction: any) => Promise<unknown>) => callback({
      get: (ref: ReturnType<typeof refFor>) => ref.get(),
      update: (ref: ReturnType<typeof refFor>, value: Record<string, unknown>) => ref.update(value),
      delete: (ref: ReturnType<typeof refFor>) => ref.delete(),
    })),
  };
}

function otpFixture(overrides: Record<string, unknown> = {}) {
  return {
    hash: computeOtpHmac('123456', 'fixed-test-salt', secret),
    salt: 'fixed-test-salt', expiresAt: Date.now() + 10 * 60 * 1000, attemptsLeft: 5,
    ...overrides,
  };
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.OTP_SECRET = secret;
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.ALLOWED_ORIGIN = 'https://staging.flouss.live';
  ({ app } = await import('../src/index.js'));
}, 30000);
afterAll(() => { delete process.env.NODE_ENV; });
beforeEach(() => {
  process.env.OTP_SECRET = secret;
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.ALLOWED_ORIGIN = 'https://staging.flouss.live';
  firestore = createFirestore();
  vi.clearAllMocks();
  mocks.getAdminFirestore.mockReturnValue(firestore);
  mocks.verifyIdToken.mockResolvedValue({ uid: tokenUid, email: 'owner@example.test' });
  mocks.updateUser.mockResolvedValue({ uid: tokenUid });
  mocks.getAdminAuth.mockReturnValue({ verifyIdToken: mocks.verifyIdToken, updateUser: mocks.updateUser });
  mocks.getFirebaseAdminApp.mockReturnValue({});
  mocks.sendWithResend.mockResolvedValue({ ok: true, status: 200 });
});

describe('OTP API', () => {
  it('returns 401 without a bearer token', async () => {
    const response = await request(app).post('/api/verify-otp').send({ code: '123456' });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required.');
    expect(mocks.getAdminAuth).not.toHaveBeenCalled();
  });

  it('uses the verified token uid and ignores a body uid', async () => {
    const response = await request(app).post('/api/send-otp')
      .set('Authorization', 'Bearer valid-test-token').send({ uid: 'attacker-controlled-uid' });
    expect(response.status).toBe(200);
    expect(docCalls).toContainEqual(['otp', tokenUid]);
    expect(docCalls).not.toContainEqual(['otp', 'attacker-controlled-uid']);
  });

  it('blocks an untrusted Origin through CORS', async () => {
    const response = await request(app).options('/api/send-otp')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Origin not allowed.');
  });

  it('locks and deletes a code after five wrong submissions', async () => {
    documents.set(`otp/${tokenUid}`, otpFixture());
    const replies = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      replies.push(await request(app).post('/api/verify-otp')
        .set('Authorization', 'Bearer valid-test-token').send({ code: '000000' }));
    }
    expect(replies.map((reply) => reply.status)).toEqual([400, 400, 400, 400, 400]);
    expect(replies[4].body.attemptsLeft).toBe(0);
    expect(documents.has(`otp/${tokenUid}`)).toBe(false);
  });

  it('rejects and deletes a code after its ten-minute expiry', async () => {
    documents.set(`otp/${tokenUid}`, otpFixture({ expiresAt: Date.now() - 1 }));
    const response = await request(app).post('/api/verify-otp')
      .set('Authorization', 'Bearer valid-test-token').send({ code: '123456' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or expired verification code.');
    expect(documents.has(`otp/${tokenUid}`)).toBe(false);
  });

  it('deletes the code after success and marks the token user verified', async () => {
    documents.set(`otp/${tokenUid}`, otpFixture());
    const response = await request(app).post('/api/verify-otp')
      .set('Authorization', 'Bearer valid-test-token')
      .send({ uid: 'attacker-controlled-uid', code: '123456' });
    expect(response.status).toBe(200);
    expect(documents.has(`otp/${tokenUid}`)).toBe(false);
    expect(mocks.updateUser).toHaveBeenCalledWith(tokenUid, { emailVerified: true });
    expect(docCalls).not.toContainEqual(['otp', 'attacker-controlled-uid']);
  });

  it('returns generic errors without leaking internal details', async () => {
    mocks.getAdminFirestore.mockImplementationOnce(() => { throw new Error('private database endpoint'); });
    const sendResponse = await request(app).post('/api/send-otp')
      .set('Authorization', 'Bearer valid-test-token').send({});
    expect(sendResponse.status).toBe(500);
    expect(sendResponse.body.error).toBe('Unable to send the verification code right now.');
    expect(JSON.stringify(sendResponse.body)).not.toContain('private database endpoint');

    documents.set(`otp/${tokenUid}`, otpFixture());
    mocks.updateUser.mockRejectedValueOnce(new Error('sensitive auth detail'));
    const verifyResponse = await request(app).post('/api/verify-otp')
      .set('Authorization', 'Bearer valid-test-token').send({ code: '123456' });
    expect(verifyResponse.status).toBe(500);
    expect(verifyResponse.body.error).toBe('Unable to verify the code right now.');
    expect(JSON.stringify(verifyResponse.body)).not.toContain('sensitive auth detail');
  });
});

describe('production startup configuration', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const entry = path.resolve(here, '../dist/index.js');
  const common: NodeJS.ProcessEnv = {
    ...process.env, NODE_ENV: 'production', PORT: '0',
    ALLOWED_ORIGIN: 'https://staging.flouss.live', OTP_SECRET: secret,
    RESEND_API_KEY: 'placeholder-test-key',
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'test-only' }),
  };
  const failsToStart = (env: NodeJS.ProcessEnv) => {
    const child = spawnSync(process.execPath, [entry], { env, encoding: 'utf8', timeout: 90000 });
    expect(child.status).toBe(1);
    expect(child.stderr).toContain('Startup configuration error');
  };

  it('fails without OTP_SECRET or with a secret shorter than 32 bytes', () => {
    const { OTP_SECRET: _secret, ...withoutSecret } = common;
    failsToStart(withoutSecret);
    failsToStart({ ...common, OTP_SECRET: 'too-short' });
  }, 120000);
  it('fails without a Firebase service account', () => {
    const { FIREBASE_SERVICE_ACCOUNT: _serviceAccount, ...withoutServiceAccount } = common;
    failsToStart(withoutServiceAccount);
  }, 60000);
  it('fails without RESEND_API_KEY', () => {
    const { RESEND_API_KEY: _resendKey, ...withoutResend } = common;
    failsToStart(withoutResend);
  }, 60000);
});
