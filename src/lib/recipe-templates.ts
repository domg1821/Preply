export interface RecipeTemplate {
  name: string;
  keywords: string[];
  default_servings: number;
  tags: string[];
  ingredients: {
    name: string;
    amount_per_serving: number;
    unit: string;
    calories_per_unit: number;
    protein_per_unit: number;
    carbs_per_unit: number;
    fat_per_unit: number;
  }[];
}

export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    name: 'Chicken Alfredo',
    keywords: ['chicken alfredo', 'alfredo'],
    default_servings: 2,
    tags: ['pasta', 'chicken', 'dinner'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 150, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'Fettuccine pasta', amount_per_serving: 100, unit: 'g', calories_per_unit: 3.71, protein_per_unit: 0.13, carbs_per_unit: 0.74, fat_per_unit: 0.016 },
      { name: 'Heavy cream', amount_per_serving: 80, unit: 'ml', calories_per_unit: 3.45, protein_per_unit: 0.025, carbs_per_unit: 0.028, fat_per_unit: 0.36 },
      { name: 'Parmesan cheese', amount_per_serving: 25, unit: 'g', calories_per_unit: 4.31, protein_per_unit: 0.38, carbs_per_unit: 0.032, fat_per_unit: 0.29 },
      { name: 'Butter', amount_per_serving: 15, unit: 'g', calories_per_unit: 7.17, protein_per_unit: 0.009, carbs_per_unit: 0.006, fat_per_unit: 0.81 },
      { name: 'Garlic cloves', amount_per_serving: 2, unit: 'cloves', calories_per_unit: 4.9, protein_per_unit: 0.21, carbs_per_unit: 1.02, fat_per_unit: 0.017 },
    ],
  },
  {
    name: 'Beef Tacos',
    keywords: ['beef tacos', 'tacos', 'taco'],
    default_servings: 2,
    tags: ['mexican', 'beef', 'dinner'],
    ingredients: [
      { name: 'Ground beef (80/20)', amount_per_serving: 150, unit: 'g', calories_per_unit: 2.54, protein_per_unit: 0.176, carbs_per_unit: 0, fat_per_unit: 0.2 },
      { name: 'Taco shells', amount_per_serving: 3, unit: 'shells', calories_per_unit: 62, protein_per_unit: 1, carbs_per_unit: 8.5, fat_per_unit: 3 },
      { name: 'Cheddar cheese', amount_per_serving: 30, unit: 'g', calories_per_unit: 4.03, protein_per_unit: 0.249, carbs_per_unit: 0.013, fat_per_unit: 0.331 },
      { name: 'Shredded lettuce', amount_per_serving: 30, unit: 'g', calories_per_unit: 0.15, protein_per_unit: 0.014, carbs_per_unit: 0.029, fat_per_unit: 0.002 },
      { name: 'Tomato', amount_per_serving: 0.5, unit: 'medium', calories_per_unit: 22, protein_per_unit: 1.1, carbs_per_unit: 4.8, fat_per_unit: 0.2 },
      { name: 'Sour cream', amount_per_serving: 30, unit: 'g', calories_per_unit: 1.93, protein_per_unit: 0.026, carbs_per_unit: 0.044, fat_per_unit: 0.2 },
    ],
  },
  {
    name: 'Baked Salmon with Quinoa',
    keywords: ['baked salmon', 'salmon quinoa', 'salmon with quinoa'],
    default_servings: 2,
    tags: ['seafood', 'healthy', 'dinner'],
    ingredients: [
      { name: 'Salmon fillet', amount_per_serving: 180, unit: 'g', calories_per_unit: 2.08, protein_per_unit: 0.2, carbs_per_unit: 0, fat_per_unit: 0.13 },
      { name: 'Quinoa', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.68, protein_per_unit: 0.14, carbs_per_unit: 0.64, fat_per_unit: 0.06 },
      { name: 'Olive oil', amount_per_serving: 10, unit: 'ml', calories_per_unit: 8.84, protein_per_unit: 0, carbs_per_unit: 0, fat_per_unit: 1 },
      { name: 'Lemon', amount_per_serving: 0.5, unit: 'whole', calories_per_unit: 22, protein_per_unit: 0.35, carbs_per_unit: 6.9, fat_per_unit: 0.24 },
      { name: 'Garlic cloves', amount_per_serving: 2, unit: 'cloves', calories_per_unit: 4.9, protein_per_unit: 0.21, carbs_per_unit: 1.02, fat_per_unit: 0.017 },
    ],
  },
  {
    name: 'Cheeseburger',
    keywords: ['cheeseburger', 'burger', 'hamburger'],
    default_servings: 1,
    tags: ['beef', 'american', 'lunch'],
    ingredients: [
      { name: 'Ground beef patty', amount_per_serving: 150, unit: 'g', calories_per_unit: 2.54, protein_per_unit: 0.176, carbs_per_unit: 0, fat_per_unit: 0.2 },
      { name: 'Burger bun', amount_per_serving: 1, unit: 'bun', calories_per_unit: 120, protein_per_unit: 4, carbs_per_unit: 22, fat_per_unit: 2 },
      { name: 'Cheddar cheese', amount_per_serving: 30, unit: 'g', calories_per_unit: 4.03, protein_per_unit: 0.249, carbs_per_unit: 0.013, fat_per_unit: 0.331 },
      { name: 'Lettuce', amount_per_serving: 20, unit: 'g', calories_per_unit: 0.15, protein_per_unit: 0.014, carbs_per_unit: 0.029, fat_per_unit: 0.002 },
      { name: 'Tomato', amount_per_serving: 0.5, unit: 'medium', calories_per_unit: 22, protein_per_unit: 1.1, carbs_per_unit: 4.8, fat_per_unit: 0.2 },
      { name: 'Ketchup', amount_per_serving: 15, unit: 'g', calories_per_unit: 1.12, protein_per_unit: 0.013, carbs_per_unit: 0.278, fat_per_unit: 0.001 },
    ],
  },
  {
    name: 'Spaghetti Bolognese',
    keywords: ['spaghetti bolognese', 'bolognese', 'spaghetti'],
    default_servings: 2,
    tags: ['pasta', 'beef', 'italian', 'dinner'],
    ingredients: [
      { name: 'Spaghetti', amount_per_serving: 100, unit: 'g', calories_per_unit: 3.71, protein_per_unit: 0.13, carbs_per_unit: 0.74, fat_per_unit: 0.016 },
      { name: 'Ground beef', amount_per_serving: 125, unit: 'g', calories_per_unit: 2.54, protein_per_unit: 0.176, carbs_per_unit: 0, fat_per_unit: 0.2 },
      { name: 'Tomato sauce', amount_per_serving: 100, unit: 'ml', calories_per_unit: 0.29, protein_per_unit: 0.012, carbs_per_unit: 0.06, fat_per_unit: 0.002 },
      { name: 'Onion', amount_per_serving: 0.5, unit: 'medium', calories_per_unit: 44, protein_per_unit: 1.2, carbs_per_unit: 10.3, fat_per_unit: 0.1 },
      { name: 'Garlic cloves', amount_per_serving: 3, unit: 'cloves', calories_per_unit: 4.9, protein_per_unit: 0.21, carbs_per_unit: 1.02, fat_per_unit: 0.017 },
      { name: 'Parmesan cheese', amount_per_serving: 20, unit: 'g', calories_per_unit: 4.31, protein_per_unit: 0.38, carbs_per_unit: 0.032, fat_per_unit: 0.29 },
    ],
  },
  {
    name: 'Grilled Chicken and Rice',
    keywords: ['grilled chicken', 'chicken and rice', 'chicken rice'],
    default_servings: 1,
    tags: ['chicken', 'healthy', 'meal-prep'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 200, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'White rice', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.65, protein_per_unit: 0.07, carbs_per_unit: 0.8, fat_per_unit: 0.006 },
      { name: 'Broccoli', amount_per_serving: 100, unit: 'g', calories_per_unit: 0.34, protein_per_unit: 0.028, carbs_per_unit: 0.065, fat_per_unit: 0.004 },
      { name: 'Olive oil', amount_per_serving: 10, unit: 'ml', calories_per_unit: 8.84, protein_per_unit: 0, carbs_per_unit: 0, fat_per_unit: 1 },
    ],
  },
  {
    name: 'Chicken Caesar Salad',
    keywords: ['caesar salad', 'chicken caesar', 'caesar'],
    default_servings: 1,
    tags: ['salad', 'chicken', 'lunch'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 150, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'Romaine lettuce', amount_per_serving: 100, unit: 'g', calories_per_unit: 0.17, protein_per_unit: 0.012, carbs_per_unit: 0.032, fat_per_unit: 0.003 },
      { name: 'Parmesan cheese', amount_per_serving: 25, unit: 'g', calories_per_unit: 4.31, protein_per_unit: 0.38, carbs_per_unit: 0.032, fat_per_unit: 0.29 },
      { name: 'Croutons', amount_per_serving: 20, unit: 'g', calories_per_unit: 4.07, protein_per_unit: 0.11, carbs_per_unit: 0.71, fat_per_unit: 0.12 },
      { name: 'Caesar dressing', amount_per_serving: 30, unit: 'ml', calories_per_unit: 3.4, protein_per_unit: 0.06, carbs_per_unit: 0.15, fat_per_unit: 0.35 },
    ],
  },
  {
    name: 'Omelette',
    keywords: ['omelette', 'omelet', 'egg omelette'],
    default_servings: 1,
    tags: ['eggs', 'breakfast', 'quick'],
    ingredients: [
      { name: 'Eggs', amount_per_serving: 3, unit: 'large', calories_per_unit: 70, protein_per_unit: 6, carbs_per_unit: 0.4, fat_per_unit: 5 },
      { name: 'Butter', amount_per_serving: 10, unit: 'g', calories_per_unit: 7.17, protein_per_unit: 0.009, carbs_per_unit: 0.006, fat_per_unit: 0.81 },
      { name: 'Cheddar cheese', amount_per_serving: 30, unit: 'g', calories_per_unit: 4.03, protein_per_unit: 0.249, carbs_per_unit: 0.013, fat_per_unit: 0.331 },
      { name: 'Bell pepper', amount_per_serving: 0.5, unit: 'medium', calories_per_unit: 31, protein_per_unit: 1, carbs_per_unit: 7.2, fat_per_unit: 0.3 },
      { name: 'Onion', amount_per_serving: 0.25, unit: 'medium', calories_per_unit: 44, protein_per_unit: 1.2, carbs_per_unit: 10.3, fat_per_unit: 0.1 },
    ],
  },
  {
    name: 'Pancakes',
    keywords: ['pancakes', 'pancake'],
    default_servings: 2,
    tags: ['breakfast', 'sweet'],
    ingredients: [
      { name: 'All-purpose flour', amount_per_serving: 75, unit: 'g', calories_per_unit: 3.64, protein_per_unit: 0.103, carbs_per_unit: 0.763, fat_per_unit: 0.01 },
      { name: 'Egg', amount_per_serving: 1, unit: 'large', calories_per_unit: 70, protein_per_unit: 6, carbs_per_unit: 0.4, fat_per_unit: 5 },
      { name: 'Milk', amount_per_serving: 100, unit: 'ml', calories_per_unit: 0.42, protein_per_unit: 0.034, carbs_per_unit: 0.048, fat_per_unit: 0.01 },
      { name: 'Butter', amount_per_serving: 15, unit: 'g', calories_per_unit: 7.17, protein_per_unit: 0.009, carbs_per_unit: 0.006, fat_per_unit: 0.81 },
      { name: 'Maple syrup', amount_per_serving: 30, unit: 'ml', calories_per_unit: 2.6, protein_per_unit: 0, carbs_per_unit: 0.67, fat_per_unit: 0 },
    ],
  },
  {
    name: 'Oatmeal',
    keywords: ['oatmeal', 'oats', 'porridge', 'oatmeal with berries'],
    default_servings: 1,
    tags: ['breakfast', 'healthy'],
    ingredients: [
      { name: 'Rolled oats', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.89, protein_per_unit: 0.167, carbs_per_unit: 0.661, fat_per_unit: 0.069 },
      { name: 'Milk', amount_per_serving: 200, unit: 'ml', calories_per_unit: 0.42, protein_per_unit: 0.034, carbs_per_unit: 0.048, fat_per_unit: 0.01 },
      { name: 'Mixed berries', amount_per_serving: 80, unit: 'g', calories_per_unit: 0.57, protein_per_unit: 0.006, carbs_per_unit: 0.143, fat_per_unit: 0.003 },
      { name: 'Honey', amount_per_serving: 15, unit: 'ml', calories_per_unit: 3.04, protein_per_unit: 0.003, carbs_per_unit: 0.824, fat_per_unit: 0 },
    ],
  },
  {
    name: 'Steak and Vegetables',
    keywords: ['steak', 'steak and vegetables', 'ribeye', 'sirloin'],
    default_servings: 1,
    tags: ['beef', 'dinner', 'keto'],
    ingredients: [
      { name: 'Sirloin steak', amount_per_serving: 200, unit: 'g', calories_per_unit: 2.07, protein_per_unit: 0.26, carbs_per_unit: 0, fat_per_unit: 0.1 },
      { name: 'Asparagus', amount_per_serving: 100, unit: 'g', calories_per_unit: 0.2, protein_per_unit: 0.022, carbs_per_unit: 0.037, fat_per_unit: 0.001 },
      { name: 'Butter', amount_per_serving: 15, unit: 'g', calories_per_unit: 7.17, protein_per_unit: 0.009, carbs_per_unit: 0.006, fat_per_unit: 0.81 },
      { name: 'Garlic cloves', amount_per_serving: 2, unit: 'cloves', calories_per_unit: 4.9, protein_per_unit: 0.21, carbs_per_unit: 1.02, fat_per_unit: 0.017 },
      { name: 'Olive oil', amount_per_serving: 10, unit: 'ml', calories_per_unit: 8.84, protein_per_unit: 0, carbs_per_unit: 0, fat_per_unit: 1 },
    ],
  },
  {
    name: 'Shrimp Stir Fry',
    keywords: ['shrimp stir fry', 'stir fry shrimp', 'shrimp fried rice'],
    default_servings: 2,
    tags: ['seafood', 'asian', 'dinner'],
    ingredients: [
      { name: 'Shrimp (peeled)', amount_per_serving: 150, unit: 'g', calories_per_unit: 0.99, protein_per_unit: 0.209, carbs_per_unit: 0, fat_per_unit: 0.011 },
      { name: 'White rice', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.65, protein_per_unit: 0.07, carbs_per_unit: 0.8, fat_per_unit: 0.006 },
      { name: 'Broccoli', amount_per_serving: 80, unit: 'g', calories_per_unit: 0.34, protein_per_unit: 0.028, carbs_per_unit: 0.065, fat_per_unit: 0.004 },
      { name: 'Bell pepper', amount_per_serving: 1, unit: 'medium', calories_per_unit: 31, protein_per_unit: 1, carbs_per_unit: 7.2, fat_per_unit: 0.3 },
      { name: 'Soy sauce', amount_per_serving: 15, unit: 'ml', calories_per_unit: 0.53, protein_per_unit: 0.085, carbs_per_unit: 0.05, fat_per_unit: 0.005 },
      { name: 'Sesame oil', amount_per_serving: 5, unit: 'ml', calories_per_unit: 8.84, protein_per_unit: 0, carbs_per_unit: 0, fat_per_unit: 1 },
    ],
  },
  {
    name: 'Turkey Sandwich',
    keywords: ['turkey sandwich', 'sandwich', 'turkey sub'],
    default_servings: 1,
    tags: ['lunch', 'turkey', 'quick'],
    ingredients: [
      { name: 'Whole wheat bread', amount_per_serving: 2, unit: 'slices', calories_per_unit: 80, protein_per_unit: 4, carbs_per_unit: 15, fat_per_unit: 1 },
      { name: 'Turkey breast (sliced)', amount_per_serving: 80, unit: 'g', calories_per_unit: 1.04, protein_per_unit: 0.22, carbs_per_unit: 0.017, fat_per_unit: 0.01 },
      { name: 'Swiss cheese', amount_per_serving: 25, unit: 'g', calories_per_unit: 3.8, protein_per_unit: 0.27, carbs_per_unit: 0.014, fat_per_unit: 0.275 },
      { name: 'Lettuce', amount_per_serving: 20, unit: 'g', calories_per_unit: 0.15, protein_per_unit: 0.014, carbs_per_unit: 0.029, fat_per_unit: 0.002 },
      { name: 'Tomato', amount_per_serving: 0.5, unit: 'medium', calories_per_unit: 22, protein_per_unit: 1.1, carbs_per_unit: 4.8, fat_per_unit: 0.2 },
      { name: 'Mustard', amount_per_serving: 10, unit: 'g', calories_per_unit: 0.66, protein_per_unit: 0.038, carbs_per_unit: 0.05, fat_per_unit: 0.038 },
    ],
  },
  {
    name: 'Chicken Stir Fry',
    keywords: ['chicken stir fry', 'stir fry'],
    default_servings: 2,
    tags: ['chicken', 'asian', 'dinner'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 150, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'White rice', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.65, protein_per_unit: 0.07, carbs_per_unit: 0.8, fat_per_unit: 0.006 },
      { name: 'Mixed vegetables', amount_per_serving: 150, unit: 'g', calories_per_unit: 0.65, protein_per_unit: 0.025, carbs_per_unit: 0.13, fat_per_unit: 0.003 },
      { name: 'Soy sauce', amount_per_serving: 15, unit: 'ml', calories_per_unit: 0.53, protein_per_unit: 0.085, carbs_per_unit: 0.05, fat_per_unit: 0.005 },
      { name: 'Garlic cloves', amount_per_serving: 2, unit: 'cloves', calories_per_unit: 4.9, protein_per_unit: 0.21, carbs_per_unit: 1.02, fat_per_unit: 0.017 },
    ],
  },
  {
    name: 'Greek Salad',
    keywords: ['greek salad', 'greek'],
    default_servings: 1,
    tags: ['salad', 'vegetarian', 'lunch'],
    ingredients: [
      { name: 'Cucumber', amount_per_serving: 100, unit: 'g', calories_per_unit: 0.15, protein_per_unit: 0.007, carbs_per_unit: 0.036, fat_per_unit: 0.001 },
      { name: 'Tomato', amount_per_serving: 1, unit: 'medium', calories_per_unit: 22, protein_per_unit: 1.1, carbs_per_unit: 4.8, fat_per_unit: 0.2 },
      { name: 'Feta cheese', amount_per_serving: 50, unit: 'g', calories_per_unit: 2.64, protein_per_unit: 0.14, carbs_per_unit: 0.041, fat_per_unit: 0.212 },
      { name: 'Kalamata olives', amount_per_serving: 30, unit: 'g', calories_per_unit: 1.15, protein_per_unit: 0.008, carbs_per_unit: 0.061, fat_per_unit: 0.107 },
      { name: 'Red onion', amount_per_serving: 0.25, unit: 'medium', calories_per_unit: 44, protein_per_unit: 1.2, carbs_per_unit: 10.3, fat_per_unit: 0.1 },
      { name: 'Olive oil', amount_per_serving: 15, unit: 'ml', calories_per_unit: 8.84, protein_per_unit: 0, carbs_per_unit: 0, fat_per_unit: 1 },
    ],
  },
  {
    name: 'French Toast',
    keywords: ['french toast'],
    default_servings: 1,
    tags: ['breakfast', 'sweet'],
    ingredients: [
      { name: 'Bread', amount_per_serving: 2, unit: 'slices', calories_per_unit: 80, protein_per_unit: 3, carbs_per_unit: 15, fat_per_unit: 1 },
      { name: 'Egg', amount_per_serving: 2, unit: 'large', calories_per_unit: 70, protein_per_unit: 6, carbs_per_unit: 0.4, fat_per_unit: 5 },
      { name: 'Milk', amount_per_serving: 60, unit: 'ml', calories_per_unit: 0.42, protein_per_unit: 0.034, carbs_per_unit: 0.048, fat_per_unit: 0.01 },
      { name: 'Butter', amount_per_serving: 10, unit: 'g', calories_per_unit: 7.17, protein_per_unit: 0.009, carbs_per_unit: 0.006, fat_per_unit: 0.81 },
      { name: 'Maple syrup', amount_per_serving: 20, unit: 'ml', calories_per_unit: 2.6, protein_per_unit: 0, carbs_per_unit: 0.67, fat_per_unit: 0 },
    ],
  },
  {
    name: 'Burrito Bowl',
    keywords: ['burrito bowl', 'burrito', 'chipotle'],
    default_servings: 1,
    tags: ['mexican', 'chicken', 'lunch'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 150, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'White rice', amount_per_serving: 80, unit: 'g', calories_per_unit: 3.65, protein_per_unit: 0.07, carbs_per_unit: 0.8, fat_per_unit: 0.006 },
      { name: 'Black beans', amount_per_serving: 80, unit: 'g', calories_per_unit: 1.32, protein_per_unit: 0.089, carbs_per_unit: 0.237, fat_per_unit: 0.005 },
      { name: 'Salsa', amount_per_serving: 40, unit: 'g', calories_per_unit: 0.36, protein_per_unit: 0.016, carbs_per_unit: 0.083, fat_per_unit: 0.003 },
      { name: 'Sour cream', amount_per_serving: 30, unit: 'g', calories_per_unit: 1.93, protein_per_unit: 0.026, carbs_per_unit: 0.044, fat_per_unit: 0.2 },
      { name: 'Shredded cheese', amount_per_serving: 30, unit: 'g', calories_per_unit: 4.03, protein_per_unit: 0.249, carbs_per_unit: 0.013, fat_per_unit: 0.331 },
    ],
  },
  {
    name: 'Avocado Toast',
    keywords: ['avocado toast', 'avo toast'],
    default_servings: 1,
    tags: ['breakfast', 'vegetarian', 'quick'],
    ingredients: [
      { name: 'Sourdough bread', amount_per_serving: 2, unit: 'slices', calories_per_unit: 90, protein_per_unit: 3.5, carbs_per_unit: 17, fat_per_unit: 0.5 },
      { name: 'Avocado', amount_per_serving: 1, unit: 'medium', calories_per_unit: 240, protein_per_unit: 3, carbs_per_unit: 12, fat_per_unit: 22 },
      { name: 'Egg', amount_per_serving: 1, unit: 'large', calories_per_unit: 70, protein_per_unit: 6, carbs_per_unit: 0.4, fat_per_unit: 5 },
      { name: 'Lemon juice', amount_per_serving: 10, unit: 'ml', calories_per_unit: 0.22, protein_per_unit: 0.003, carbs_per_unit: 0.069, fat_per_unit: 0.002 },
    ],
  },
  {
    name: 'Protein Smoothie',
    keywords: ['smoothie', 'protein shake', 'protein smoothie'],
    default_servings: 1,
    tags: ['breakfast', 'high-protein', 'quick'],
    ingredients: [
      { name: 'Protein powder', amount_per_serving: 30, unit: 'g', calories_per_unit: 3.7, protein_per_unit: 0.25, carbs_per_unit: 0.04, fat_per_unit: 0.02 },
      { name: 'Banana', amount_per_serving: 1, unit: 'medium', calories_per_unit: 89, protein_per_unit: 1.1, carbs_per_unit: 23, fat_per_unit: 0.3 },
      { name: 'Milk', amount_per_serving: 250, unit: 'ml', calories_per_unit: 0.42, protein_per_unit: 0.034, carbs_per_unit: 0.048, fat_per_unit: 0.01 },
      { name: 'Peanut butter', amount_per_serving: 30, unit: 'g', calories_per_unit: 5.88, protein_per_unit: 0.236, carbs_per_unit: 0.2, fat_per_unit: 0.5 },
    ],
  },
  {
    name: 'Chicken Soup',
    keywords: ['chicken soup', 'chicken noodle soup'],
    default_servings: 4,
    tags: ['soup', 'chicken', 'comfort'],
    ingredients: [
      { name: 'Chicken breast', amount_per_serving: 100, unit: 'g', calories_per_unit: 1.65, protein_per_unit: 0.31, carbs_per_unit: 0, fat_per_unit: 0.036 },
      { name: 'Egg noodles', amount_per_serving: 50, unit: 'g', calories_per_unit: 1.38, protein_per_unit: 0.046, carbs_per_unit: 0.251, fat_per_unit: 0.021 },
      { name: 'Chicken broth', amount_per_serving: 300, unit: 'ml', calories_per_unit: 0.086, protein_per_unit: 0.006, carbs_per_unit: 0.0014, fat_per_unit: 0.003 },
      { name: 'Carrots', amount_per_serving: 50, unit: 'g', calories_per_unit: 0.41, protein_per_unit: 0.009, carbs_per_unit: 0.096, fat_per_unit: 0.002 },
      { name: 'Celery', amount_per_serving: 30, unit: 'g', calories_per_unit: 0.14, protein_per_unit: 0.007, carbs_per_unit: 0.03, fat_per_unit: 0.002 },
      { name: 'Onion', amount_per_serving: 0.25, unit: 'medium', calories_per_unit: 44, protein_per_unit: 1.2, carbs_per_unit: 10.3, fat_per_unit: 0.1 },
    ],
  },
];

export function searchTemplates(query: string): RecipeTemplate[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return RECIPE_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q) || q.includes(k))
  );
}
