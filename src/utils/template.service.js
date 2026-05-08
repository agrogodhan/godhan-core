/**
 * Template resolver — no credentials or paths stored here.
 * Resolution order:
 *   1. Local file: <cwd>/templates/<channel>_<key>.hbs
 *   2. MongoDB Template model (if registered by the consuming service)
 *
 * The Template mongoose model is looked up lazily from the mongoose model
 * registry — the consuming service registers it by importing its own model.
 */

import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import mongoose from 'mongoose';
import coreLogger from './logger.js';

async function getLocalTemplate(channel, key) {
  const filePath = path.join(process.cwd(), 'templates', `${channel}_${key}.hbs`);
  if (await fs.pathExists(filePath)) return fs.readFile(filePath, 'utf8');
  return null;
}

async function getTemplate(channel, key, logger = coreLogger) {
  const local = await getLocalTemplate(channel, key);
  if (local) return Handlebars.compile(local);

  const TemplateModel = mongoose.models?.Template || null;
  if (TemplateModel) {
    const doc = await TemplateModel.findOne({ key, channel });
    if (doc?.html) return Handlebars.compile(doc.html);
  }

  logger.warn(`[core.template] not found: ${channel}_${key}`);
  return null;
}

export default getTemplate;
