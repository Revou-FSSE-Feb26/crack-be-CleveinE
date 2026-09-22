import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserById } from '../store.js';
import { auth, requireFields, tokenFor } from '../middleware.js';
import { publicUser } from '../data.js';

const router = Router();
router.post('/register', requireFields('name', 'email', 'password'), async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  if (req.body.password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await findUserByEmail(email)) return res.status(409).json({ message: 'Email already registered' });
  const user = await createUser({ name: req.body.name.trim(), email, password: req.body.password });
  res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
});
router.post('/login', requireFields('email', 'password'), async (req, res) => {
  const user = await findUserByEmail(req.body.email.toLowerCase().trim());
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect' });
  res.json({ user: publicUser(user), token: tokenFor(user) });
});
router.get('/me', auth, async (req, res) => { const user = await findUserById(req.user.id); if (!user) return res.status(404).json({ message: 'User not found' }); res.json(publicUser(user)); });
export default router;
