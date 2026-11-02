const m = require('mongoose');
const { Schema } = m;
const ref = n => ({ type: Schema.Types.ObjectId, ref: n });

exports.User = m.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }            // bcrypt hash, never plain text
}, { timestamps: true }));

exports.Project = m.model('Project', new Schema({
  name: { type: String, required: true, trim: true },
  owner: ref('User'),
  members: [ref('User')]
}, { timestamps: true }));

exports.Task = m.model('Task', new Schema({
  project: { ...ref('Project'), index: true },
  title: { type: String, required: true, trim: true },
  desc: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
  prio: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  due: { type: String, default: '' },                   // YYYY-MM-DD
  assignee: { type: String, default: '' }               // member email
}, { timestamps: true }));
