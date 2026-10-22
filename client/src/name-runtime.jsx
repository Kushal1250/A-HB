// Style visible names at React's rendering boundary, including dynamic reveals.
// Values, attributes, editor data, and accessible labels keep their original text.
import { jsx as baseJsx, jsxs as baseJsxs, Fragment } from 'birthday-original-jsx';
import { jsxDEV as baseDev } from 'birthday-original-jsx-dev';
export { Fragment };
const namePattern = /\b(?:anu|kushal)(?:\s+patel)?\b/gi;
const plainTags = new Set(['textarea','option','script','style','title','text','tspan','textPath']);
function decorate(value) {
  if (Array.isArray(value)) return value.map(decorate);
  if (typeof value !== 'string') return value;
  const matches = [...value.matchAll(namePattern)];
  if (!matches.length) return value;
  const parts = []; let start = 0;
  for (const match of matches) {
    parts.push(value.slice(start, match.index));
    parts.push(baseJsx('strong', { className: 'birthday-person-name', children: match[0] }, `name-${match.index}`));
    start = match.index + match[0].length;
  }
  parts.push(value.slice(start));
  return parts;
}
function styleProps(type, props) {
  if (typeof type !== 'string' || !props) return props;
  if (plainTags.has(type)) return props;
  const next = { ...props, children: decorate(props.children) };
  if (type === 'input' && typeof props.value === 'string' && /\b(?:anu|kushal)(?:\s+patel)?\b/i.test(props.value)) {
    next.className = `${props.className || ''} birthday-person-input`;
  }
  return next;
}
export const jsx = (type, props, key) => baseJsx(type, styleProps(type, props), key);
export const jsxs = (type, props, key) => baseJsxs(type, styleProps(type, props), key);
export const jsxDEV = (type, props, ...args) => baseDev(type, styleProps(type, props), ...args);
