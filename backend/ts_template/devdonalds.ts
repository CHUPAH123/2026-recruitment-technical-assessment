import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

interface summary {
  name: string;
  cookTime: number;
  ingredients: requiredItem[];
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req: Request, res: Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;

});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  let newName = recipeName.replace(/[^-/_a-zA-Z\s]/g, "")
  newName = newName.replace(/[-/_]/g, " ")
  if (newName.length <= 0) {
    return null
  }
  let newNameArray = newName.split(" ")
  newNameArray = newNameArray.map(word => word.toLowerCase())
  newNameArray = newNameArray.map(word => word[0].toUpperCase() + word.slice(1))
  let final = newNameArray.join(" ")
  return final
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req: Request, res: Response) => {
  let newRecipe = req.body
  if (newRecipe.type != "recipe" && newRecipe.type != "ingredient") {
    return res.status(400).json({})
  }

  for (const item of cookbook) {
    if (newRecipe.name === item.name) {
      return res.status(400).json({})
    }
  }
  if (newRecipe.type === "recipe") {
    let recipeReq = newRecipe.requiredItems
    let ingredientList = []
    for (const item of recipeReq) {
      if (ingredientList.includes(item.name)) {
        return res.status(400).json({})
      } else {
        ingredientList.push(item.name)
      }
      if (item.cookTime < 0 || item.quantity < 0) {
        return res.status(400).json({})
      }

    }
  } else {
    if (newRecipe.cookTime < 0) {
      return res.status(400).json({})
    }
  }

  cookbook.push(newRecipe)

  return res.status(200).json({})
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
const getIngredientsHelper = (recipeName: string): requiredItem[] | null => {
  let allIngredients = []
  const recipe = cookbook.find(r => r.name === recipeName)
  if (!recipe) {
    return null
  }
  for (const item of recipe.requiredItems) {
    const itemExists = cookbook.find(i => i.name == item.name)
    if (!itemExists) {
      return null
    }
    let ingred = cookbook.find(r => r.name === item.name)
    if (ingred.type == "recipe") {
      let ingredients = getIngredientsHelper(ingred.name)
      for (const ingred of ingredients) {
        let add = false;
        for (const added of allIngredients) {
          if (added.name == ingred.name) {
            added.quantity += ingred.quantity
            add = true;
          }
        }
        if (!add) {
          allIngredients.push(ingred)
        }
      }
    } else {
      let add = false;
      for (const added of allIngredients) {
        if (added.name == item.name) {
          added.quantity += item.quantity
          add = true;
        }
      }
      if (!add) {
        allIngredients.push(item)
      }
      
    }
  }
  return allIngredients
}

app.get("/summary", (req: Request, res: Response) => {
  let reqName = req.query.name as string;
  const recipe = cookbook.find(r => r.name === reqName)
  
  if (!recipe) {
    return res.status(400).json({})
  }
  
  if (recipe.type == "ingredient") {
    return res.status(400).json({})
  }
  let ingredientsArray = getIngredientsHelper(reqName)
  if (!ingredientsArray) {
    return res.status(400).json({})
  }
  let totalCookTime = 0;
  for (const item of ingredientsArray) {
    let ingredient = cookbook.find(i => i.name === item.name)
    totalCookTime += item.quantity * ingredient.cookTime
  }
  const newSummary: summary = {
    name: reqName,
    cookTime: totalCookTime,
    ingredients: ingredientsArray
  }
  return res.status(200).json({newSummary})

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
