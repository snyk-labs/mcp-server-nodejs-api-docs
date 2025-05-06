import fetch from 'node-fetch';
import { initLogger } from '../utils/logger.js';

const logger = initLogger();

export async function fetchNodeApiDocs() {
  logger.info({ msg: 'Fetching Node.js API documentation...' });
  const url = 'https://nodejs.org/docs/latest/api/all.json';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    logger.info({ msg: 'Successfully fetched Node.js API documentation', url });
    return data;
  } catch (error) {
    logger.error({ err: error, msg: `Failed to fetch Node.js API documentation: ${url}` });
    throw error;
  }
}

export function formatContent(content) {
  if (!content) return '';
  return content.replace(/\n/g, '\n\n');
}

export function normalizeModuleName(name) {
  return name.toLowerCase().replace(/[_\s-]/g, '');
}

export function findModuleByName(modules, searchName) {
  const normalizedSearch = normalizeModuleName(searchName);
  return modules.find(module => 
    normalizeModuleName(module.name) === normalizedSearch ||
    normalizeModuleName(module.textRaw) === normalizedSearch ||
    (module.displayName && normalizeModuleName(module.displayName) === normalizedSearch)
  );
}