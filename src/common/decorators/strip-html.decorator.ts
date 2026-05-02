import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
// import sanitizeHtml = require('sanitize-html');

export const StripHtml = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  });
