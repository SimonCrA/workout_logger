import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db, Exercise, Muscle, eq } from 'astro:db'

export const exercises = {
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

    }),
};

