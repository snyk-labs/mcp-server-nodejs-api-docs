import { initLogger } from '../utils/logger.js';
import { normalizeModuleName } from '../utils/format.js';

const logger = initLogger();
const url = 'https://nodejs.org/docs/latest/api/all.json';

let modulesData = null;

async function fetchNodeApiDocs() {
  logger.info({ msg: 'Fetching Node.js API documentation...' });
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

export async function getApiDocsModules() {

  if (modulesData) {
    // return from cached data
    return modulesData;
  }

  const apiDocs = await fetchNodeApiDocs();
  
  // Remove entries without Class or Method
  const originalCount = apiDocs.modules?.length;
  apiDocs.modules = apiDocs.modules.filter(module => 
    module?.classes?.length > 0 || module?.methods?.length > 0
  );
  logger.info({ msg: `Modules count: ${originalCount}` });

  // persist the data in the singleton before returning
  modulesData = apiDocs.modules;

  return {
    modules: apiDocs.modules
  }

}

export function findModuleByName(modules, searchName) {
  const normalizedSearch = normalizeModuleName(searchName);
  return modules.find(module => 
    normalizeModuleName(module.name) === normalizedSearch ||
    normalizeModuleName(module.textRaw) === normalizedSearch ||
    (module.displayName && normalizeModuleName(module.displayName) === normalizedSearch)
  );
}