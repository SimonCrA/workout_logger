import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db, eq, Workout, Exercise, Muscle } from 'astro:db'

export const server = {
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

    getExercisesByMuscle: defineAction({
        accept: "json",
        input: z.object({
            muscleName: z.string().trim().regex(/^[a-zA-Z]+$/),
        }),
        handler: async ({ muscleName }) => {

            const exercisesByMuscle = await db
                .select()
                .from(Exercise)
                .innerJoin(Muscle, eq(Exercise.muscleId, Muscle.id))
                .where(eq(Muscle.name, muscleName))

            return { success: true, exercises: exercisesByMuscle };
        },

    })
};

