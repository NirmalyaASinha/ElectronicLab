import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['STUDENT', 'FACULTY']),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  rollNumber: z.string().optional(),
  employeeId: z.string().optional(),
  semester: z.number().min(1).max(8).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateRequestSchema = z.object({
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(500, 'Purpose must be at most 500 characters'),
  items: z
    .array(
      z.object({
        componentId: z.string().uuid('Invalid component ID'),
        quantity: z.number().min(1).max(20),
      })
    )
    .min(1, 'At least one component is required')
    .max(10, 'Maximum 10 components per request'),
});

export const ApproveRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export const ProcessReturnSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid('Invalid item ID'),
      returnedQty: z.number().min(0),
      condition: z.enum(['Good', 'Damaged', 'Lost']),
    })
  ),
});

export const CreateFineSchema = z.object({
  studentId: z.string().uuid(),
  requestId: z.string().uuid(),
  itemId: z.string().uuid().optional(),
  reason: z.enum(['OVERDUE', 'DAMAGED', 'LOST']),
  amount: z.number().min(0),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
export type ApproveRequestInput = z.infer<typeof ApproveRequestSchema>;
export type ProcessReturnInput = z.infer<typeof ProcessReturnSchema>;
export type CreateFineInput = z.infer<typeof CreateFineSchema>;
