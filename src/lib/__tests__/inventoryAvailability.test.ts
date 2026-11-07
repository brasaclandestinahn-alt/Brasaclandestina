import test from "node:test";
import assert from "node:assert/strict";
import { 
  calculateProductAvailability, 
  calculateCatalogAvailability,
  validateOrderStock 
} from "../inventoryAvailability.ts";
import type { Product, Ingredient } from "../mockDB.ts";

// Mock de inventario base para pruebas
const mockIngredients: Ingredient[] = [
  { id: "i1", name: "Pan de Hamburguesa", stock: 100, unit: "u", cost_per_unit: 5.0 },
  { id: "i2", name: "Carne de Res (Molida)", stock: 15000, unit: "g", cost_per_unit: 0.15 },
  { id: "i3", name: "Queso Cheddar", stock: 200, unit: "u", cost_per_unit: 3.0 },
  { id: "i4", name: "Papas", stock: 5000, unit: "g", cost_per_unit: 0.05 },
  { id: "i5", name: "Lata Coca-Cola", stock: 24, unit: "u", cost_per_unit: 15.0 },
];

test("1. Cálculo básico: producto con receta completa y stock abundante", () => {
  const burger: Product = {
    id: "p1",
    name: "Hamburguesa Clásica",
    description: "Con carne y queso",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },    // 100 / 1 = 100 porciones
      { ingredient_id: "i2", quantity: 200 },  // 15000 / 200 = 75 porciones
      { ingredient_id: "i3", quantity: 2 },    // 200 / 2 = 100 porciones
    ],
  };

  const result = calculateProductAvailability(burger, mockIngredients);

  assert.equal(result.productId, "p1");
  assert.equal(result.availablePortions, 75);
  assert.equal(result.status, "Disponible");
  assert.equal(result.recipeValid, true);
  assert.deepEqual(result.limitingIngredients, ["Carne de Res (Molida)"]);
  assert.deepEqual(result.missingIngredients, []);
});

test("2. Identificación correcta de cuello de botella / ingrediente limitante", () => {
  const lowBreadIngredients: Ingredient[] = [
    { id: "i1", name: "Pan de Hamburguesa", stock: 3, unit: "u", cost_per_unit: 5.0 },
    { id: "i2", name: "Carne de Res (Molida)", stock: 15000, unit: "g", cost_per_unit: 0.15 },
    { id: "i3", name: "Queso Cheddar", stock: 200, unit: "u", cost_per_unit: 3.0 },
  ];

  const burger: Product = {
    id: "p1",
    name: "Hamburguesa Clásica",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },    // 3 porciones
      { ingredient_id: "i2", quantity: 200 },  // 75 porciones
      { ingredient_id: "i3", quantity: 2 },    // 100 porciones
    ],
  };

  const result = calculateProductAvailability(burger, lowBreadIngredients);

  assert.equal(result.availablePortions, 3);
  assert.equal(result.status, "Pocas unidades");
  assert.deepEqual(result.limitingIngredients, ["Pan de Hamburguesa"]);
});

test("3. Múltiples ingredientes limitantes empatados", () => {
  const tiedIngredients: Ingredient[] = [
    { id: "i1", name: "Pan de Hamburguesa", stock: 10, unit: "u", cost_per_unit: 5.0 }, // 10 / 1 = 10
    { id: "i3", name: "Queso Cheddar", stock: 20, unit: "u", cost_per_unit: 3.0 },       // 20 / 2 = 10
  ];

  const snack: Product = {
    id: "p_snack",
    name: "Pan con queso",
    description: "",
    category: "Snacks",
    price: 50,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },
      { ingredient_id: "i3", quantity: 2 },
    ],
  };

  const result = calculateProductAvailability(snack, tiedIngredients);

  assert.equal(result.availablePortions, 10);
  assert.equal(result.limitingIngredients.length, 2);
  assert.ok(result.limitingIngredients.includes("Pan de Hamburguesa"));
  assert.ok(result.limitingIngredients.includes("Queso Cheddar"));
});

test("4. Redondeo hacia abajo exacto (floor)", () => {
  const ingredients: Ingredient[] = [
    { id: "i1", name: "Carne", stock: 550, unit: "g", cost_per_unit: 0.15 },
  ];

  const steak: Product = {
    id: "p_steak",
    name: "Filete",
    description: "",
    category: "Carnes",
    price: 200,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 200 }], // 550 / 200 = 2.75 -> debe ser 2
  };

  const result = calculateProductAvailability(steak, ingredients);
  assert.equal(result.availablePortions, 2);
});

test("5. Producto agotado por falta total de un insumo (0 porciones)", () => {
  const noMeatIngredients: Ingredient[] = [
    { id: "i1", name: "Pan", stock: 100, unit: "u", cost_per_unit: 5.0 },
    { id: "i2", name: "Carne", stock: 0, unit: "g", cost_per_unit: 0.15 },
  ];

  const burger: Product = {
    id: "p1",
    name: "Burger",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },
      { ingredient_id: "i2", quantity: 200 },
    ],
  };

  const result = calculateProductAvailability(burger, noMeatIngredients);
  assert.equal(result.availablePortions, 0);
  assert.equal(result.status, "Agotado");
  assert.deepEqual(result.limitingIngredients, ["Carne"]);
});

test("6. No permitir resultados negativos si el stock en DB es negativo", () => {
  const negativeStockIngredients: Ingredient[] = [
    { id: "i1", name: "Pan", stock: -10, unit: "u", cost_per_unit: 5.0 },
  ];

  const item: Product = {
    id: "p1",
    name: "Pan simple",
    description: "",
    category: "Panadería",
    price: 10,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 1 }],
  };

  const result = calculateProductAvailability(item, negativeStockIngredients);
  assert.equal(result.availablePortions, 0);
  assert.equal(result.status, "Agotado");
});

test("7. Consolidación de insumos duplicados en la receta (suma de consumo)", () => {
  const ingredients: Ingredient[] = [
    { id: "i3", name: "Queso Cheddar", stock: 10, unit: "u", cost_per_unit: 3.0 },
  ];

  // Receta con Queso duplicado (ej. 2 rebanadas base + 2 rebanadas extra = 4 total)
  const doubleCheese: Product = {
    id: "p_cheese",
    name: "Doble Queso",
    description: "",
    category: "Hamburguesas",
    price: 180,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i3", quantity: 2 },
      { ingredient_id: "i3", quantity: 2 }, // Total consumido: 4 por plato. 10 / 4 = 2.5 -> 2
    ],
  };

  const result = calculateProductAvailability(doubleCheese, ingredients);
  assert.equal(result.availablePortions, 2);
  assert.equal(result.status, "Pocas unidades");
});

test("8. Validación de cantidades en receta: cantidades <= 0 invalidan la receta", () => {
  const ingredients: Ingredient[] = [
    { id: "i1", name: "Pan", stock: 100, unit: "u", cost_per_unit: 5.0 },
  ];

  const badRecipeProduct: Product = {
    id: "p_bad",
    name: "Plato inválido",
    description: "",
    category: "Varios",
    price: 100,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 0 }], // Cantidad cero
  };

  const result = calculateProductAvailability(badRecipeProduct, ingredients);
  assert.equal(result.recipeValid, false);
  assert.equal(result.availablePortions, 0);
  assert.equal(result.status, "Sin receta / Configuración incompleta");
});

test("9. Insumo no existente en la base de datos invalida la receta y se reporta", () => {
  const productWithGhostIngredient: Product = {
    id: "p_ghost",
    name: "Plato con ingrediente borrado",
    description: "",
    category: "Varios",
    price: 100,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "i1", quantity: 1 },
      { ingredient_id: "insumo_inexistente_999", quantity: 50 },
    ],
  };

  const result = calculateProductAvailability(productWithGhostIngredient, mockIngredients);
  assert.equal(result.recipeValid, false);
  assert.equal(result.availablePortions, 0);
  assert.equal(result.status, "Sin receta / Configuración incompleta");
  assert.deepEqual(result.missingIngredients, ["insumo_inexistente_999"]);
});

test("10. Plato sin receta configurada: devuelve 'Sin receta' y 0 porciones (NUNCA 99)", () => {
  const unconfiguredProduct: Product = {
    id: "p_empty",
    name: "Plato nuevo sin receta",
    description: "",
    category: "Varios",
    price: 250,
    image_url: "",
    is_active: true,
    recipe: [],
  };

  const result = calculateProductAvailability(unconfiguredProduct, mockIngredients);
  assert.equal(result.recipeValid, false);
  assert.equal(result.availablePortions, 0);
  assert.equal(result.status, "Sin receta / Configuración incompleta");
});

test("11. Productos exceptuados expresamente de inventario ('none')", () => {
  const serviceProduct: Product = {
    id: "p_delivery",
    name: "Cargo por Envío Especial",
    description: "Servicio de flete",
    category: "Servicios",
    price: 50,
    image_url: "",
    is_active: true,
    recipe: [],
    inventory_tracking: "none",
  };

  const result = calculateProductAvailability(serviceProduct, mockIngredients);
  assert.equal(result.recipeValid, true);
  assert.equal(result.availablePortions, 999);
  assert.equal(result.status, "Sin seguimiento");
  assert.deepEqual(result.missingIngredients, []);
});

test("12. Productos con inventario directo (bebidas empaquetadas)", () => {
  const sodaProduct: Product = {
    id: "p_coke",
    name: "Coca-Cola en Lata",
    description: "Lata 355ml",
    category: "Bebidas",
    price: 35,
    image_url: "",
    is_active: true,
    recipe: [],
    inventory_tracking: "direct",
    direct_ingredient_id: "i5", // Lata Coca-Cola stock = 24
  };

  const result = calculateProductAvailability(sodaProduct, mockIngredients);
  assert.equal(result.recipeValid, true);
  assert.equal(result.availablePortions, 24);
  assert.equal(result.status, "Disponible");
});

test("13. Contemplar productos inactivos (is_active: false)", () => {
  const inactiveBurger: Product = {
    id: "p1",
    name: "Hamburguesa Desactivada",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: false, // Inactivo
    recipe: [
      { ingredient_id: "i1", quantity: 1 },
      { ingredient_id: "i2", quantity: 200 },
    ],
  };

  const result = calculateProductAvailability(inactiveBurger, mockIngredients);
  assert.equal(result.recipeValid, true);
  assert.equal(result.availablePortions, 0); // 0 por estar inactivo
  assert.equal(result.status, "Agotado");
});

test("14. Cálculo por catálogo completo (calculateCatalogAvailability)", () => {
  const products: Product[] = [
    {
      id: "p1",
      name: "Burger",
      description: "",
      category: "Comida",
      price: 100,
      image_url: "",
      is_active: true,
      recipe: [{ ingredient_id: "i1", quantity: 1 }],
    },
    {
      id: "p2",
      name: "Soda",
      description: "",
      category: "Bebida",
      price: 30,
      image_url: "",
      is_active: true,
      recipe: [],
      inventory_tracking: "direct",
      direct_ingredient_id: "i5",
    },
  ];

  const map = calculateCatalogAvailability(products, mockIngredients);
  assert.equal(map.size, 2);
  assert.equal(map.get("p1")?.availablePortions, 100);
  assert.equal(map.get("p2")?.availablePortions, 24);
});

test("15. validateOrderStock: Rechaza pedido cuando productos distintos comparten insumo y superan el stock", () => {
  // Solo 2 panes disponibles en cocina
  const limitedIngredients: Ingredient[] = [
    { id: "i1", name: "Pan de Hamburguesa", stock: 2, unit: "u", cost_per_unit: 5.0 },
    { id: "i2", name: "Carne", stock: 10000, unit: "g", cost_per_unit: 0.15 },
  ];

  const burgerA: Product = {
    id: "p_a",
    name: "Burger Clásica",
    description: "",
    category: "Hamburguesas",
    price: 100,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 1 }, { ingredient_id: "i2", quantity: 200 }],
  };

  const burgerB: Product = {
    id: "p_b",
    name: "Burger Especial",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 1 }, { ingredient_id: "i2", quantity: 200 }],
  };

  const products = [burgerA, burgerB];

  // Pedido con 2 Burger A y 1 Burger B (requiere 3 panes, pero solo hay 2)
  const orderItems = [
    { product_id: "p_a", quantity: 2 },
    { product_id: "p_b", quantity: 1 },
  ];

  const validation = validateOrderStock(orderItems, products, limitedIngredients);
  assert.equal(validation.isValid, false);
  assert.ok(validation.error?.includes("Pan de Hamburguesa"));
  assert.equal(validation.insufficientIngredients[0].required, 3);
  assert.equal(validation.insufficientIngredients[0].available, 2);
});

test("16. validateOrderStock: Aprueba pedido cuando el consumo agregado es menor o igual al stock", () => {
  const limitedIngredients: Ingredient[] = [
    { id: "i1", name: "Pan de Hamburguesa", stock: 4, unit: "u", cost_per_unit: 5.0 },
    { id: "i2", name: "Carne", stock: 10000, unit: "g", cost_per_unit: 0.15 },
  ];

  const burgerA: Product = {
    id: "p_a",
    name: "Burger Clásica",
    description: "",
    category: "Hamburguesas",
    price: 100,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "i1", quantity: 1 }, { ingredient_id: "i2", quantity: 200 }],
  };

  const orderItems = [
    { product_id: "p_a", quantity: 3 }, // Requiere 3 panes, hay 4 -> OK
  ];

  const validation = validateOrderStock(orderItems, [burgerA], limitedIngredients);
  assert.equal(validation.isValid, true);
  assert.equal(validation.insufficientIngredients.length, 0);
});

test("17. validateOrderStock: Rechaza bebidas directas que exceden stock disponible", () => {
  const ingredients: Ingredient[] = [
    { id: "i5", name: "Lata Coca-Cola", stock: 2, unit: "u", cost_per_unit: 15.0 },
  ];

  const soda: Product = {
    id: "p_soda",
    name: "Coca Cola",
    description: "",
    category: "Bebidas",
    price: 35,
    image_url: "",
    is_active: true,
    recipe: [],
    inventory_tracking: "direct",
    direct_ingredient_id: "i5",
  };

  const orderItems = [{ product_id: "p_soda", quantity: 3 }]; // Pide 3, hay 2

  const validation = validateOrderStock(orderItems, [soda], ingredients);
  assert.equal(validation.isValid, false);
  assert.ok(validation.error?.includes("Lata Coca-Cola"));
});

test("18. validateOrderStock: Rechaza productos sin receta que no están exceptuados de tracking", () => {
  const itemSinReceta: Product = {
    id: "p_norecipe",
    name: "Plato Fantasma",
    description: "",
    category: "Cocina",
    price: 200,
    image_url: "",
    is_active: true,
    recipe: [],
    // inventory_tracking es default (recipe)
  };

  const validation = validateOrderStock([{ product_id: "p_norecipe", quantity: 1 }], [itemSinReceta], mockIngredients);
  assert.equal(validation.isValid, false);
  assert.ok(validation.error?.includes("no tiene receta"));
});

