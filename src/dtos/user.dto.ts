import { z } from 'zod';

export const CreateUserDTO = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin']).optional().default('user'),
    image: z.string().optional(),
});

export const UpdateUserDTO = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.enum(['user', 'admin']).optional(),
    image: z.string().optional(),
});

export type CreateUserDTOType = z.infer<typeof CreateUserDTO>;
export type UpdateUserDTOType = z.infer<typeof UpdateUserDTO>;
