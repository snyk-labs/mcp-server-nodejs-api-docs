import { formatContent } from "../utils/format.js";

export function formatModuleSummary(module) {
  let content = `## ${module.displayName || module.textRaw} (${module.name})\n`;

  if (
    (module.methods && module.methods.length > 0) ||
    (module.modules && module.modules.length > 0)
  ) {
    content += `### Methods\n`;

    module?.methods?.forEach((method) => {
      content += `#### ${method.textRaw}\n`;
      content += `#### ${method.desc}\n`;
    });

    module?.modules?.forEach((submodules) => {
      submodules?.methods?.forEach((method) => {
        content += `#### ${method.textRaw}\n`;
        content += `#### ${method.desc}\n`;
      });
    });
  }

  return content + "\n";
}

export function createModuleDocumentation(
  module,
  { class: classQuery, method: methodQuery } = {}
) {
  let content = `# ${module.textRaw}\n\n`;

  if (module.desc) {
    content += `## Description\n${formatContent(module.desc)}\n\n`;
  }

  content += formatItems(module.classes, "Classes", classQuery);
  content += formatItems(module.methods, "Methods", methodQuery);
  content += formatItems(module.modules, "Submodules", methodQuery);

  return content;
}

function formatItems(items, title, query) {
  if (!items || items.length === 0) return "";

  let sectionContent = "";

  // Phase 1, look up data inside the current object
  const filteredItems = query
    ? items.filter(
        (item) =>
          item.textRaw.toLowerCase().includes(query.toLowerCase()) ||
          (item.desc && item.desc.toLowerCase().includes(query.toLowerCase()))
      )
    : items;

  if (filteredItems.length !== 0) {
    sectionContent = `## ${title}\n\n`;
    filteredItems.forEach((item) => {
      sectionContent += `### ${item.textRaw}\n`;
      if (item.desc) sectionContent += `${formatContent(item.desc)}\n\n`;
    });
  }

  // Phase 2, we dive deeper into nested methods inside module?.modules?.methods
  items.forEach((submodule) => {
    if (submodule?.methods) {
      sectionContent += `### ${submodule.textRaw} Methods\n\n`;
      submodule.methods.forEach((submethod) => {
        sectionContent += `#### ${submethod.textRaw}\n`;
        if (submethod.desc)
          sectionContent += `${formatContent(submethod.desc)}\n\n`;
      });
    }
  });

  return sectionContent;
}