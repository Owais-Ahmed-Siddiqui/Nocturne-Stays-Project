const { getDb } = require('../config/database');
const AppError = require('../utils/AppError');

function db() {
  const d = getDb();
  if (!d) throw new AppError(503, 'Database not configured');
  return d;
}

async function findByEmail(email) {
  const { data, error } = await db()
    .from('users')
    .select('id, name, email, role, password_hash, created_at')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await db()
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Includes password hash — only for password verification/changes
async function findWithHashById(id) {
  const { data, error } = await db()
    .from('users')
    .select('id, name, email, role, password_hash')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateName(id, name) {
  const { error } = await db().from('users').update({ name }).eq('id', id);
  if (error) throw error;
}

async function updatePassword(id, password_hash) {
  const { error } = await db().from('users').update({ password_hash }).eq('id', id);
  if (error) throw error;
}

async function create({ name, email, password_hash, role }) {
  const { data, error } = await db()
    .from('users')
    .insert([{ name, email, password_hash, role }])
    .select('id, name, email, role')
    .single();
  if (error) throw error;
  return data;
}

async function listAll() {
  const { data, error } = await db()
    .from('users')
    .select('id, name, email, role, created_at')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
}

async function deleteNonAdmins() {
  const { error } = await db().from('users').delete().eq('role', 'user');
  if (error) throw error;
}

module.exports = {
  findByEmail,
  findById,
  findWithHashById,
  create,
  listAll,
  updateName,
  updatePassword,
  deleteNonAdmins
};
