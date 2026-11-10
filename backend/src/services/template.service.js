function resolvePath(data, path) {
  return path.split('.').reduce((accumulator, segment) => {
    if (accumulator == null || typeof accumulator !== 'object') {
      return undefined;
    }
    return accumulator[segment];
  }, data);
}

function parseTemplateVariables(templateString = '') {
  const matches = [...templateString.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g)];
  return [...new Set(matches.map((match) => match[1]))];
}

function validateRequiredVars(templateString, data = {}) {
  const requiredVars = parseTemplateVariables(templateString);
  const missing = requiredVars.filter((variable) => resolvePath(data, variable) === undefined);

  if (missing.length > 0) {
    throw new Error(`Missing required template variables: ${missing.join(', ')}`);
  }

  return true;
}

function renderTemplate(templateString = '', data = {}) {
  return templateString.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, variable) => {
    const value = resolvePath(data, variable);

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  });
}

module.exports = {
  parseTemplateVariables,
  validateRequiredVars,
  renderTemplate,
  resolvePath,
};
