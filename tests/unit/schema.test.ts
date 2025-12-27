import { describe, it, expect } from 'vitest';
import {
    insertProjectSchema,
    insertMessageSchema,
    emailUpdateSchema,
    scenarioSelectionSchema,
    imageApprovalSchema
} from '../../shared/schema';

describe('Schema Validation', () => {
    describe('insertProjectSchema', () => {
        it('should validate valid project data', () => {
            const validData = {
                title: 'Test Project',
                rawInput: 'Test input',
                clientName: 'Test Client'
            };

            const result = insertProjectSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject project without title', () => {
            const invalidData = {
                rawInput: 'Test input'
            };

            const result = insertProjectSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow optional fields', () => {
            const minimalData = {
                title: 'Test Project'
            };

            const result = insertProjectSchema.safeParse(minimalData);
            expect(result.success).toBe(true);
        });
    });

    describe('insertMessageSchema', () => {
        it('should validate valid message data', () => {
            const validData = {
                projectId: 'test-id',
                role: 'user',
                content: 'Test message'
            };

            const result = insertMessageSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject message without role', () => {
            const invalidData = {
                projectId: 'test-id',
                content: 'Test message'
            };

            const result = insertMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject message without content', () => {
            const invalidData = {
                projectId: 'test-id',
                role: 'user'
            };

            const result = insertMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('emailUpdateSchema', () => {
        it('should validate valid email', () => {
            const validData = {
                email: 'test@example.com'
            };

            const result = emailUpdateSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email format', () => {
            const invalidData = {
                email: 'not-an-email'
            };

            const result = emailUpdateSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('scenarioSelectionSchema', () => {
        it('should validate scenario A', () => {
            const result = scenarioSelectionSchema.safeParse({ scenario: 'A' });
            expect(result.success).toBe(true);
        });

        it('should validate scenario B', () => {
            const result = scenarioSelectionSchema.safeParse({ scenario: 'B' });
            expect(result.success).toBe(true);
        });

        it('should reject invalid scenario', () => {
            const result = scenarioSelectionSchema.safeParse({ scenario: 'C' });
            expect(result.success).toBe(false);
        });
    });

    describe('imageApprovalSchema', () => {
        it('should validate with imageId', () => {
            const result = imageApprovalSchema.safeParse({ imageId: 'test-id' });
            expect(result.success).toBe(true);
        });

        it('should validate with imageUrl', () => {
            const result = imageApprovalSchema.safeParse({ imageUrl: 'https://example.com/image.png' });
            expect(result.success).toBe(true);
        });

        it('should validate with both imageId and imageUrl', () => {
            const result = imageApprovalSchema.safeParse({
                imageId: 'test-id',
                imageUrl: 'https://example.com/image.png'
            });
            expect(result.success).toBe(true);
        });

        it('should reject without either field', () => {
            const result = imageApprovalSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });
});
