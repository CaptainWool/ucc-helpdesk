import { z } from 'zod';

/**
 * Validates data against a Zod schema.
 * Logs warnings if validation fails, but returns the original data (safe mode).
 * If strict mode is enabled, throws error.
 * @param {z.ZodSchema} schema 
 * @param {any} data 
 * @param {string} contextName 
 * @param {boolean} strict 
 * @returns {any}
 */
export const validate = (schema: z.ZodSchema, data: any, contextName = 'Data', strict = false) => {
    try {
        return schema.parse(data);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.warn(`[Validation Warning] ${contextName} schema mismatch:`, e.issues);
            console.warn('Received data:', data);
        } else {
            console.error(`[Validation Error] ${contextName}:`, e);
        }

        if (strict) throw e;
        return data; // Return data anyway in non-strict mode to prevent app crash
    }
};
