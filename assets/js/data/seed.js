/**
 * Seed content written to the database the first time the app runs.
 * After seeding, the database is the source of truth — these values are also
 * used as the offline fallback when no database is available.
 */

export const SEED_PANTRY = [
  {id:"toor-dal", name:"Toor dal", category:"ingredient", have:true},
  {id:"basmati-rice", name:"Basmati rice", category:"ingredient", have:true},
  {id:"dried-chickpeas", name:"Dried chickpeas", category:"ingredient", have:false},
  {id:"dried-kidney-beans", name:"Dried kidney beans", category:"ingredient", have:false},
  {id:"onion", name:"Onion", category:"ingredient", have:true},
  {id:"tomato", name:"Tomato", category:"ingredient", have:false},
  {id:"ginger-garlic-paste", name:"Ginger-garlic paste", category:"ingredient", have:true},
  {id:"cumin-seeds", name:"Cumin seeds", category:"ingredient", have:true},
  {id:"turmeric", name:"Turmeric", category:"ingredient", have:true},
  {id:"red-chili-powder", name:"Red chili powder", category:"ingredient", have:true},
  {id:"coriander-powder", name:"Coriander powder", category:"ingredient", have:true},
  {id:"garam-masala", name:"Garam masala", category:"ingredient", have:true},
  {id:"chana-masala-mix", name:"Chana masala spice mix", category:"ingredient", have:false},
  {id:"ghee", name:"Ghee", category:"ingredient", have:true},
  {id:"oil", name:"Oil", category:"ingredient", have:true},
  {id:"cilantro", name:"Cilantro", category:"ingredient", have:false},
  {id:"lemon", name:"Lemon", category:"ingredient", have:false},
  {id:"dried-red-chilies", name:"Dried red chilies", category:"ingredient", have:true},
  {id:"whole-spices", name:"Whole spices (bay leaf, cloves, cardamom)", category:"ingredient", have:true},
  {id:"salt", name:"Salt", category:"ingredient", have:true},
  {id:"napkins", name:"Napkins", category:"misc", have:false},
  {id:"dish-soap", name:"Dish soap", category:"misc", have:true},
  {id:"trash-bags", name:"Trash bags", category:"misc", have:true},
  {id:"paper-towels", name:"Paper towels", category:"misc", have:false},
  {id:"aluminum-foil", name:"Aluminum foil", category:"misc", have:true}
];

export const SEED_RECIPES = [
  {
    id:"dal-tadka", name:"Dal Tadka", cookTimeMin:25, servings:4,
    tags:["dal","vegetarian","weeknight"],
    ingredients:[
      {name:"Toor dal", qty:"1 cup"},
      {name:"Turmeric", qty:"1/2 tsp"},
      {name:"Salt", qty:"to taste"},
      {name:"Onion", qty:"1, chopped"},
      {name:"Tomato", qty:"1, chopped"},
      {name:"Ginger-garlic paste", qty:"1 tbsp"},
      {name:"Cumin seeds", qty:"1 tsp"},
      {name:"Ghee", qty:"2 tbsp"},
      {name:"Dried red chilies", qty:"2"},
      {name:"Garam masala", qty:"1/2 tsp"},
      {name:"Cilantro", qty:"for garnish"}
    ],
    prepSteps:[
      "Soak toor dal in water for 30 minutes (or overnight in the fridge)",
      "Chop onion and tomato, mince ginger-garlic ahead",
      "Measure turmeric and garam masala into a small bowl"
    ],
    instructions:"Rinse the soaked dal and add it to the Instant Pot with 3 cups water, turmeric, and salt. Pressure cook on High for 8 minutes, then let it natural release for 10 minutes. Meanwhile heat ghee in a small pan, add cumin seeds and dried chilies, then onion, ginger-garlic, and tomato; cook until soft and fragrant. Stir the tempering into the dal, add garam masala, and finish with cilantro."
  },
  {
    id:"chana-masala", name:"Chana Masala", cookTimeMin:45, servings:4,
    tags:["legumes","vegan","meal-prep"],
    ingredients:[
      {name:"Dried chickpeas", qty:"1.5 cups, soaked"},
      {name:"Onion", qty:"1 large, chopped"},
      {name:"Tomato", qty:"2, pureed"},
      {name:"Ginger-garlic paste", qty:"1 tbsp"},
      {name:"Cumin seeds", qty:"1 tsp"},
      {name:"Coriander powder", qty:"1 tbsp"},
      {name:"Red chili powder", qty:"1 tsp"},
      {name:"Turmeric", qty:"1/2 tsp"},
      {name:"Chana masala spice mix", qty:"1.5 tbsp"},
      {name:"Oil", qty:"2 tbsp"},
      {name:"Salt", qty:"to taste"},
      {name:"Cilantro", qty:"for garnish"},
      {name:"Lemon", qty:"for garnish"}
    ],
    prepSteps:[
      "Soak chickpeas in water overnight (8+ hours)",
      "Chop the onion and puree the tomatoes ahead",
      "Portion the spice mix into a small bowl"
    ],
    instructions:"Set to Sauté, heat oil, and cook cumin seeds, onion, and ginger-garlic until golden. Add tomato puree and spices, cooking 3-4 minutes. Add drained chickpeas and 2 cups water. Pressure cook on High for 20 minutes, natural release 15 minutes. Mash a few chickpeas to thicken the sauce, then finish with cilantro and a squeeze of lemon."
  },
  {
    id:"jeera-rice", name:"Jeera Rice", cookTimeMin:20, servings:4,
    tags:["rice","side","quick"],
    ingredients:[
      {name:"Basmati rice", qty:"1.5 cups"},
      {name:"Cumin seeds", qty:"1.5 tsp"},
      {name:"Ghee", qty:"2 tbsp"},
      {name:"Whole spices (bay leaf, cloves, cardamom)", qty:"1 set"},
      {name:"Salt", qty:"to taste"}
    ],
    prepSteps:[
      "Rinse and soak basmati rice for 20 minutes, then drain"
    ],
    instructions:"Set to Sauté, melt ghee, and toast cumin seeds with the whole spices until fragrant. Add the drained rice and stir for a minute to coat. Add 2 cups water and salt. Pressure cook on High for 4 minutes, natural release 8 minutes, then fluff with a fork."
  },
  {
    id:"rajma", name:"Rajma (Kidney Bean Curry)", cookTimeMin:50, servings:4,
    tags:["legumes","vegan","freezer-friendly"],
    ingredients:[
      {name:"Dried kidney beans", qty:"1.5 cups, soaked"},
      {name:"Onion", qty:"1, chopped"},
      {name:"Tomato", qty:"2, pureed"},
      {name:"Ginger-garlic paste", qty:"1 tbsp"},
      {name:"Cumin seeds", qty:"1 tsp"},
      {name:"Coriander powder", qty:"1 tbsp"},
      {name:"Red chili powder", qty:"1 tsp"},
      {name:"Garam masala", qty:"1 tsp"},
      {name:"Oil", qty:"2 tbsp"},
      {name:"Salt", qty:"to taste"},
      {name:"Cilantro", qty:"for garnish"}
    ],
    prepSteps:[
      "Soak rajma in water overnight (8+ hours)",
      "Chop the onion and puree the tomatoes ahead",
      "Mince ginger and garlic ahead"
    ],
    instructions:"Sauté cumin seeds, onion, and ginger-garlic until golden. Add tomato puree and spices, cooking until the oil separates. Add drained rajma and 2.5 cups water. Pressure cook on High for 25 minutes, natural release 15 minutes. Mash slightly to thicken, then finish with garam masala and cilantro."
  }
];


/** An all-false prep checklist matching a seed recipe's step count. */
function seedPrepDone(recipeId) {
  const recipe = SEED_RECIPES.find((r) => r.id === recipeId);
  return recipe ? recipe.prepSteps.map(() => false) : [];
}

/** The example week created on first run. */
export const SEED_DAYS = {
  Mon: { recipeId: 'dal-tadka', prepDone: seedPrepDone('dal-tadka') },
  Tue: null,
  Wed: { recipeId: 'chana-masala', prepDone: seedPrepDone('chana-masala') },
  Thu: null,
  Fri: { recipeId: 'rajma', prepDone: seedPrepDone('rajma') },
  Sat: { recipeId: 'jeera-rice', prepDone: seedPrepDone('jeera-rice') },
  Sun: null,
};

/** A fresh, unplanned week. */
export function emptyDays() {
  return { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null };
}
