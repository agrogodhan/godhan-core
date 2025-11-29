import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import logger from '../utils/logger.js';

// Optional MongoDB backed Template model: if app loaded mongoose and model exists, use DB fallback
let TemplateModel = null;
try { TemplateModel = require('mongoose').model('Template'); } catch (e) { TemplateModel = null; }

async function getLocalTemplate(channel, key) {
  const filePath = path.join(process.cwd(), 'templates', `${channel}_${key}.hbs`);
  if (await fs.pathExists(filePath)) return (await fs.readFile(filePath, 'utf8'));
  return null;
}

async function getTemplate(channel, key) {
  const local = await getLocalTemplate(channel, key);
  if (local) return Handlebars.compile(local);
  if (TemplateModel) {
    const doc = await TemplateModel.findOne({ key, channel });
    if (doc && doc.html) return Handlebars.compile(doc.html);
  }
  logger.warn(`template: not found ${channel}_${key}`);
  return null;
}

export default getTemplate;
