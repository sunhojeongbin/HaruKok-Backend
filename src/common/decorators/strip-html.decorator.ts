import { Transform, type TransformFnParams } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export const StripHtml = () =>
  Transform((params: TransformFnParams): unknown => {
    const value: unknown = params.value;

    if (typeof value !== 'string') return value;

    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  });
