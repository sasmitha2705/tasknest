const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Project, Task } = require('./models');

const h = fn => (req, res, next) => fn(req, res, next).catch(next);   // forwards async errors
const sign = u => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// JWT middleware: reads "Authorization: Bearer <token>" and sets req.uid
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.uid = jwt.verify(token, process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Please sign in again.' }); }
}
const mine = (id, uid) => Project.findOne({ _id: id, members: uid });  // membership check
const pick = b => Object.fromEntries(
  ['title', 'desc', 'status', 'prio', 'due', 'assignee'].filter(k => b[k] !== undefined).map(k => [k, b[k]]));

/* ---------- Auth ---------- */
router.post('/auth/signup', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ error: 'Enter your name, a valid email and a password of 6+ characters.' });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ error: 'That email already has an account. Sign in instead.' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  await Project.create({ name: 'My first project', owner: u._id, members: [u._id] });
  res.status(201).json({ token: sign(u) });
}));

router.post('/auth/login', h(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(u) });
}));

/* ---------- Workspace snapshot ---------- */
router.get('/bootstrap', auth, h(async (req, res) => {
  const me = await User.findById(req.uid);
  if (!me) return res.status(401).json({ error: 'Please sign in again.' });
  const projects = await Project.find({ members: req.uid })
    .populate('members', 'name email').populate('owner', 'email');
  const tasks = await Task.find({ project: { $in: projects.map(p => p._id) } });
  const users = {};
  projects.forEach(p => p.members.forEach(m => { users[m.email] = { email: m.email, name: m.name }; }));
  res.json({
    me: { email: me.email, name: me.name },
    users: Object.values(users),
    projects: projects.map(p => ({ id: p.id, name: p.name, owner: p.owner.email, members: p.members.map(m => m.email) })),
    tasks: tasks.map(t => ({ id: t.id, pid: String(t.project), title: t.title, desc: t.desc,
      status: t.status, prio: t.prio, due: t.due, assignee: t.assignee }))
  });
}));

/* ---------- Projects ---------- */
router.post('/projects', auth, h(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Enter a project name.' });
  const p = await Project.create({ name, owner: req.uid, members: [req.uid] });
  res.status(201).json({ id: p.id });
}));

router.post('/projects/:id/members', auth, h(async (req, res) => {
  const p = await Project.findOne({ _id: req.params.id, owner: req.uid });   // owner-only
  if (!p) return res.status(403).json({ error: 'Only the project owner can add members.' });
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u) return res.status(404).json({ error: 'No account found for that email. Ask them to sign up first.' });
  if (p.members.some(m => m.equals(u._id))) return res.status(409).json({ error: 'Already a member.' });
  p.members.push(u._id); await p.save();
  res.json({ ok: true });
}));

/* ---------- Tasks ---------- */
router.post('/projects/:id/tasks', auth, h(async (req, res) => {
  if (!await mine(req.params.id, req.uid)) return res.status(404).json({ error: 'Project not found.' });
  const t = await Task.create({ ...pick(req.body), project: req.params.id });
  res.status(201).json({ id: t.id });
}));

router.put('/tasks/:id', auth, h(async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t || !await mine(t.project, req.uid)) return res.status(404).json({ error: 'Task not found.' });
  Object.assign(t, pick(req.body)); await t.save();
  res.json({ ok: true });
}));

router.delete('/tasks/:id', auth, h(async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t || !await mine(t.project, req.uid)) return res.status(404).json({ error: 'Task not found.' });
  await t.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
