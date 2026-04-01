class TextNode {
  constructor(text) {
    this.nodeType = 3;
    this.text = text;
    this.parentNode = null;
  }

  get textContent() {
    return this.text;
  }

  get innerText() {
    return this.text;
  }
}

class ElementNode {
  constructor(tagName, attributes = {}) {
    this.nodeType = 1;
    this.tagName = tagName.toLowerCase();
    this.attributes = attributes;
    this.children = [];
    this.parentNode = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  get textContent() {
    return this.children.map((child) => child.textContent).join("");
  }

  get innerText() {
    return this.textContent;
  }

  querySelectorAll(selector) {
    return querySelectorAllFrom(this, selector);
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }
}

class SimpleDocument {
  constructor(rootElement) {
    this.rootElement = rootElement;
  }

  querySelectorAll(selector) {
    return querySelectorAllFrom(this.rootElement, selector);
  }
}

function parseHtml(html) {
  const root = new ElementNode("document");
  const stack = [root];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g;
  let match;

  while ((match = tokenPattern.exec(html))) {
    const token = match[0];

    if (token.startsWith("<!--")) {
      continue;
    }

    if (token.startsWith("</")) {
      stack.pop();
      continue;
    }

    if (token.startsWith("<")) {
      if (/^<!doctype/i.test(token)) {
        continue;
      }

      const selfClosing = token.endsWith("/>");
      const rawTag = token.slice(1, selfClosing ? -2 : -1).trim();
      const firstSpaceIndex = rawTag.search(/\s/);
      const tagName = (firstSpaceIndex === -1 ? rawTag : rawTag.slice(0, firstSpaceIndex)).toLowerCase();
      const attributeSource = firstSpaceIndex === -1 ? "" : rawTag.slice(firstSpaceIndex + 1);
      const attributes = parseAttributes(attributeSource);
      const element = new ElementNode(tagName, attributes);

      stack[stack.length - 1].appendChild(element);

      if (!selfClosing) {
        stack.push(element);
      }
      continue;
    }

    if (token.trim()) {
      stack[stack.length - 1].appendChild(new TextNode(token));
    }
  }

  return new SimpleDocument(root);
}

function parseAttributes(source) {
  const attributes = {};
  const attributePattern = /([^\s=]+)(?:=("([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  let match;

  while ((match = attributePattern.exec(source))) {
    attributes[match[1]] = match[3] ?? match[4] ?? match[5] ?? "";
  }

  return attributes;
}

function querySelectorAllFrom(root, selectorGroup) {
  const selectors = selectorGroup.split(",").map((selector) => selector.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();

  for (const selector of selectors) {
    const parts = selector.split(/\s+/).filter(Boolean);

    walk(root, (node) => {
      if (!(node instanceof ElementNode)) {
        return;
      }

      if (!matchesSelectorParts(node, parts)) {
        return;
      }

      if (!seen.has(node)) {
        seen.add(node);
        results.push(node);
      }
    });
  }

  return results;
}

function walk(node, visit) {
  if (!(node instanceof ElementNode)) {
    return;
  }

  for (const child of node.children) {
    visit(child);
    walk(child, visit);
  }
}

function matchesSelector(element, selector) {
  const parts = selector.split(/\s+/).filter(Boolean);
  return matchesSelectorParts(element, parts);
}

function matchesSelectorParts(element, parts) {
  let current = element;

  if (!matchesSimpleSelector(current, parts[parts.length - 1])) {
    return false;
  }

  for (let index = parts.length - 2; index >= 0; index -= 1) {
    current = findMatchingAncestor(current.parentNode, parts[index]);
    if (!current) {
      return false;
    }
  }

  return true;
}

function findMatchingAncestor(startNode, simpleSelector) {
  let current = startNode;

  while (current) {
    if (current instanceof ElementNode && matchesSimpleSelector(current, simpleSelector)) {
      return current;
    }
    current = current.parentNode;
  }

  return null;
}

function matchesSimpleSelector(element, selector) {
  const parsed = parseSimpleSelector(selector);

  if (parsed.tagName && parsed.tagName !== element.tagName) {
    return false;
  }

  return parsed.attributes.every(({ name, value }) => element.getAttribute(name) === value);
}

function parseSimpleSelector(selector) {
  const tagMatch = selector.match(/^[a-zA-Z0-9_-]+/);
  const attributes = [];
  const attributePattern = /\[([^\]=]+)="([^"]*)"\]/g;
  let match;

  while ((match = attributePattern.exec(selector))) {
    attributes.push({
      name: match[1],
      value: match[2]
    });
  }

  return {
    tagName: tagMatch ? tagMatch[0].toLowerCase() : "",
    attributes
  };
}

module.exports = {
  parseHtml
};
