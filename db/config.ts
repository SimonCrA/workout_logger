import { defineDb, defineTable, column, NOW } from 'astro:db';

const User = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text({ unique: true }),
    email: column.text({ unique: true }),
    password: column.text(),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    isActive: column.boolean({ default: true }),
    isPro: column.boolean({ default: false }),
    isAdmin: column.boolean({ default: false }),

  }
})

// Muscle catalog
const Muscle = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    code: column.text({ unique: true }),
    view: column.text(),
    isActive: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW })
  }
})

// Exercise catalog
const Exercise = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    muscleId: column.number({ references: () => Muscle.columns.id }),
    name: column.text({ unique: true }),
    description: column.text({ optional: true }),
    isActive: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW })
  },
})

// Workout log
const Workout = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    exerciseId: column.number({ references: () => Exercise.columns.id }),
    userId: column.number({ references: () => User.columns.id }),
    reps: column.number(), // int
    weight: column.number(), // float
    isIMS: column.boolean({ default: true }),
    comment: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
  },
})

// https://astro.build/db/config
export default defineDb({
  tables: { User, Muscle, Exercise, Workout }
});
