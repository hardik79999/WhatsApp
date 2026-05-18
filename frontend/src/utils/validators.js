// Created by: Master Fix Pass

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'audio/ogg',
  'application/pdf',
];

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

export function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    return { valid: false, error: 'Valid 10-digit Indian mobile number daalo' };
  }
  return { valid: true, error: '', value: normalized };
}

export function validateOtp(otp) {
  const value = String(otp || '').trim();
  if (!/^\d{6}$/.test(value)) {
    return { valid: false, error: 'OTP exactly 6 digits ka hona chahiye' };
  }
  return { valid: true, error: '', value };
}

export function validateMessage(content) {
  if (!String(content || '').trim()) {
    return { valid: false, error: 'Message empty nahi ho sakta' };
  }
  return { valid: true, error: '', value: String(content).trim() };
}

export function validateGroupName(name) {
  const value = String(name || '').trim();
  if (!value) return { valid: false, error: 'Group name required hai' };
  if (value.length > 100) return { valid: false, error: 'Group name 100 characters se chhota hona chahiye' };
  return { valid: true, error: '', value };
}

export function validateFileUpload(file) {
  if (!file) return { valid: false, error: 'File select karo' };
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return { valid: false, error: 'Ye file type supported nahi hai' };
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return { valid: false, error: 'File too bada hai, 50MB se chhota hona chahiye' };
  }
  return { valid: true, error: '' };
}

export function validateUsername(name) {
  const value = String(name || '').trim();
  if (!value) return { valid: false, error: 'Username required hai' };
  if (value.length > 50) return { valid: false, error: 'Username 50 characters se chhota hona chahiye' };
  if (!/^[A-Za-z0-9 ]+$/.test(value)) {
    return { valid: false, error: 'Username mein sirf letters, numbers aur spaces allowed hain' };
  }
  return { valid: true, error: '', value };
}

export function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
