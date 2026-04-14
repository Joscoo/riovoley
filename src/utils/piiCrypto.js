const encoder = new TextEncoder();

let aesKeyPromise;
let hmacKeyPromise;

const toBase64 = (bytes) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const bytesToHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const getSecret = () => {
  const secret = process.env.REACT_APP_PII_ENCRYPTION_KEY;
  if (!secret || !secret.trim()) {
    throw new Error(
      'Falta REACT_APP_PII_ENCRYPTION_KEY. Configura una clave de cifrado para email/telefono en el frontend.'
    );
  }
  return secret.trim();
};

const getAesKey = async () => {
  if (!aesKeyPromise) {
    aesKeyPromise = (async () => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(getSecret()));
      return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt']);
    })();
  }
  return aesKeyPromise;
};

const getHmacKey = async () => {
  if (!hmacKeyPromise) {
    hmacKeyPromise = (async () => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${getSecret()}:hmac`));
      return crypto.subtle.importKey(
        'raw',
        digest,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
    })();
  }
  return hmacKeyPromise;
};

const normalizeEmail = (value) => value.trim().toLowerCase();

const normalizePhone = (value) => value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').trim();

const maskEmail = (email) => {
  const [localPart, domain = ''] = email.split('@');
  if (!localPart) return '***';

  const localMask = localPart.length <= 2
    ? `${localPart[0] || '*'}*`
    : `${localPart[0]}${'*'.repeat(Math.max(1, localPart.length - 2))}${localPart[localPart.length - 1]}`;

  if (!domain) return localMask;

  const domainParts = domain.split('.');
  const head = domainParts[0] || '';
  const tail = domainParts.slice(1).join('.');
  const headMask = head.length <= 2
    ? `${head[0] || '*'}*`
    : `${head[0]}${'*'.repeat(Math.max(1, head.length - 2))}${head[head.length - 1]}`;

  return `${localMask}@${tail ? `${headMask}.${tail}` : headMask}`;
};

const maskPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const visible = digits.slice(-4);
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${visible}`;
};

const buildNgramSet = (value) => {
  const cleaned = value.replace(/\s+/g, '');
  const grams = new Set([cleaned]);

  if (cleaned.length <= 3) {
    grams.add(cleaned);
    return Array.from(grams);
  }

  for (let i = 0; i <= cleaned.length - 3; i += 1) {
    grams.add(cleaned.slice(i, i + 3));
  }

  return Array.from(grams);
};

const signToken = async (payload) => {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(signature));
};

const encryptValue = async (plaintext, context) => {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encoder.encode(`riovoley:${context}:v1`)
    },
    key,
    encoder.encode(plaintext)
  );

  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
};

const buildFieldPayload = async (context, rawValue, normalizer, masker) => {
  if (rawValue === undefined) {
    return null;
  }

  if (rawValue === null || `${rawValue}`.trim() === '') {
    return {
      [`${context}_ciphertext`]: null,
      [`${context}_search_exact`]: null,
      [`${context}_search_partial`]: null,
      [`${context}_masked`]: null
    };
  }

  const normalized = normalizer(`${rawValue}`);
  const exactToken = await signToken(`${context}:exact:${normalized}`);
  const partialTokens = await Promise.all(
    buildNgramSet(normalized).map((token) => signToken(`${context}:partial:${token}`))
  );

  return {
    [`${context}_ciphertext`]: await encryptValue(normalized, context),
    [`${context}_search_exact`]: exactToken,
    [`${context}_search_partial`]: Array.from(new Set(partialTokens)),
    [`${context}_masked`]: masker(normalized)
  };
};

export const withEncryptedUserContactFields = async (userPayload) => {
  const hasEmail = Object.prototype.hasOwnProperty.call(userPayload, 'email');
  const hasPhone = Object.prototype.hasOwnProperty.call(userPayload, 'telefono');

  if (!hasEmail && !hasPhone) {
    return userPayload;
  }

  // Fail fast if encryption key is missing and a protected field is being written.
  getSecret();

  const emailPayload = hasEmail
    ? await buildFieldPayload('email', userPayload.email, normalizeEmail, maskEmail)
    : null;
  const phonePayload = hasPhone
    ? await buildFieldPayload('telefono', userPayload.telefono, normalizePhone, maskPhone)
    : null;

  return {
    ...userPayload,
    ...(emailPayload || {}),
    ...(phonePayload || {})
  };
};

export const buildSearchTokenExact = async (context, value) => {
  const normalized = context === 'email' ? normalizeEmail(value) : normalizePhone(value);
  return signToken(`${context}:exact:${normalized}`);
};
