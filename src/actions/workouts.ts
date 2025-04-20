import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db, Workout } from 'astro:db'

export const workouts = {
    addWorkout: defineAction({
        accept: "json",
        input: z.object({
            exerciseId: z.number().int(),
            reps: z.number().int().min(1),
            weight: z.number().positive(),
        }),
        handler: async ({ exerciseId, reps, weight }) => {
            // sintaxide drizzle para hacer queries
            const newRecord = await db.insert(Workout).values({ exerciseId, reps, weight }).returning();
            return { success: true, record: newRecord };
        },
    }),
};

