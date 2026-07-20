const { z } = require('zod');

/**
 * Validate request body against a Zod schema.
 * Returns 400 with field errors on failure.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, error: 'Validation failed', errors });
    }
    req.body = result.data;
    next();
  };
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
});

const createWorkerSchema = z.object({
  workerId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  upiId: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'CASH', 'BANK']).optional(),
  notes: z.string().optional(),
  supervisorId: z.string().optional(),
});

const updateWorkerSchema = createWorkerSchema.partial();

const paymentSchema = z.object({
  workerId: z.string(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

const settingSchema = z.object({
  value: z.string(),
});

const createUserSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'SUPERVISOR']).optional(),
});

module.exports = {
  validate,
  loginSchema,
  createWorkerSchema,
  updateWorkerSchema,
  paymentSchema,
  settingSchema,
  createUserSchema,
};
