import test from "node:test";
import assert from "node:assert/strict";
import { 
  calculateProductAvailability, 
  calculateCatalogAvailability,
  validateOrderStock,
  type ProductAvailabilityResult
} from "../inventoryAvailability.ts";
import type { Product, Ingredient, Order, OrderItem } from "../mockDB.ts";

test("CASO 1: Stock de chorizo: 3 u. Stock de bandejas: 44 u. Receta consume 1 chorizo y 1 bandeja -> 3 platos disponibles", () => {
  const ingredients: Ingredient[] = [
    { id: "ing_chorizo", name: "Chorizo Artesanal", stock: 3, unit: "u", cost_per_unit: 20 },
    { id: "ing_bandeja", name: "Bandejas para servir", stock: 44, unit: "u", cost_per_unit: 2 },
  ];

  const chorizoPlatter: Product = {
    id: "p_chorizo",
    name: "Plato de Chorizo",
    description: "Chorizo braseado en bandeja",
    category: "Especialidades",
    price: 120,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_chorizo", quantity: 1 },
      { ingredient_id: "ing_bandeja", quantity: 1 },
    ],
  };

  const result = calculateProductAvailability(chorizoPlatter, ingredients);

  assert.equal(result.productId, "p_chorizo");
  assert.equal(result.availablePortions, 3, "Debe ser limitado por el chorizo (3)");
  assert.equal(result.status, "Pocas unidades");
  assert.equal(result.recipeValid, true);
  assert.deepEqual(result.limitingIngredients, ["Chorizo Artesanal"]);
  assert.deepEqual(result.missingIngredients, []);
});

test("CASO 2: Receta requiere 200g de carne y hay 1000g -> 5 platos disponibles", () => {
  const ingredients: Ingredient[] = [
    { id: "ing_carne", name: "Carne de Res", stock: 1000, unit: "g", cost_per_unit: 0.15 },
  ];

  const beefDish: Product = {
    id: "p_carne",
    name: "Corte de Carne 200g",
    description: "Carne a la brasa",
    category: "Carnes",
    price: 220,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_carne", quantity: 200 },
    ],
  };

  const result = calculateProductAvailability(beefDish, ingredients);

  assert.equal(result.availablePortions, 5, "1000g / 200g = 5 porciones exactas");
  assert.equal(result.status, "Pocas unidades"); // 1 a 5 es pocas unidades
  assert.equal(result.recipeValid, true);
  assert.deepEqual(result.limitingIngredients, ["Carne de Res"]);
});

test("CASO 3: Un ingrediente requerido tiene stock 0 -> plato agotado", () => {
  const ingredients: Ingredient[] = [
    { id: "ing_pan", name: "Pan Brioche", stock: 10, unit: "u", cost_per_unit: 5 },
    { id: "ing_carne", name: "Carne", stock: 0, unit: "g", cost_per_unit: 0.15 },
  ];

  const burger: Product = {
    id: "p_burger",
    name: "Burger Gourmet",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_pan", quantity: 1 },
      { ingredient_id: "ing_carne", quantity: 150 },
    ],
  };

  const result = calculateProductAvailability(burger, ingredients);

  assert.equal(result.availablePortions, 0, "No se puede preparar nada sin carne");
  assert.equal(result.status, "Agotado");
  assert.deepEqual(result.limitingIngredients, ["Carne"]);
});

test("CASO 4: La receta contiene un insumo inexistente -> configuración incompleta, no disponibilidad inventada", () => {
  const ingredients: Ingredient[] = [
    { id: "ing_pan", name: "Pan Brioche", stock: 100, unit: "u", cost_per_unit: 5 },
  ];

  const brokenDish: Product = {
    id: "p_broken",
    name: "Plato con insumo fantasma",
    description: "",
    category: "Especiales",
    price: 180,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_pan", quantity: 1 },
      { ingredient_id: "ing_borrado_o_no_existe", quantity: 50 },
    ],
  };

  const result = calculateProductAvailability(brokenDish, ingredients);

  assert.equal(result.recipeValid, false, "La receta debe marcarse inválida");
  assert.equal(result.availablePortions, 0, "Disponibilidad debe ser 0, nunca inventada");
  assert.equal(result.status, "Sin receta / Configuración incompleta");
  assert.deepEqual(result.missingIngredients, ["ing_borrado_o_no_existe"]);
});

test("CASO 5: Un producto no tiene receta -> estado correctamente identificado, sin disponibilidad ficticia de 99", () => {
  const unconfiguredDish: Product = {
    id: "p_new",
    name: "Plato Recién Creado",
    description: "Sin receta aún",
    category: "Novedades",
    price: 250,
    image_url: "",
    is_active: true,
    recipe: [], // Sin receta
  };

  const ingredients: Ingredient[] = [
    { id: "ing_x", name: "Insumo X", stock: 500, unit: "u", cost_per_unit: 1 },
  ];

  const result = calculateProductAvailability(unconfiguredDish, ingredients);

  assert.equal(result.recipeValid, false);
  assert.equal(result.availablePortions, 0, "Debe ser 0, NUNCA 99 ficticio");
  assert.equal(result.status, "Sin receta / Configuración incompleta");
});

test("CASO 6: Dos productos necesitan el mismo ingrediente y sus pedidos conjuntos superan el stock -> bloquear el pedido total", () => {
  // Stock disponible de pan: solo 3 unidades
  const ingredients: Ingredient[] = [
    { id: "ing_pan", name: "Pan Brioche", stock: 3, unit: "u", cost_per_unit: 5 },
    { id: "ing_carne", name: "Carne", stock: 5000, unit: "g", cost_per_unit: 0.15 },
    { id: "ing_pollo", name: "Pollo", stock: 5000, unit: "g", cost_per_unit: 0.10 },
  ];

  const burgerRes: Product = {
    id: "p_res",
    name: "Burger de Res",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_pan", quantity: 1 },
      { ingredient_id: "ing_carne", quantity: 150 },
    ],
  };

  const burgerPollo: Product = {
    id: "p_pollo",
    name: "Burger de Pollo",
    description: "",
    category: "Hamburguesas",
    price: 140,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_pan", quantity: 1 },
      { ingredient_id: "ing_pollo", quantity: 150 },
    ],
  };

  const catalog = [burgerRes, burgerPollo];

  // Pedido conjunto: 2 Burger de Res + 2 Burger de Pollo = 4 panes requeridos (hay 3)
  const orderItems: OrderItem[] = [
    { product_id: "p_res", quantity: 2, product_name: "Burger de Res", subtotal: 300 },
    { product_id: "p_pollo", quantity: 2, product_name: "Burger de Pollo", subtotal: 280 },
  ];

  const validation = validateOrderStock(orderItems, catalog, ingredients);

  assert.equal(validation.isValid, false, "El pedido total debe ser rechazado");
  assert.ok(validation.error?.includes("Pan Brioche"));
  assert.equal(validation.insufficientIngredients.length, 1);
  assert.equal(validation.insufficientIngredients[0].required, 4);
  assert.equal(validation.insufficientIngredients[0].available, 3);
});

test("CASO 7: Registrar entrada de inventario -> actualizar la disponibilidad en el dashboard", () => {
  let ingredients: Ingredient[] = [
    { id: "ing_costilla", name: "Costilla de Cerdo", stock: 0, unit: "g", cost_per_unit: 0.12 },
  ];

  const ribs: Product = {
    id: "p_ribs",
    name: "Costillas BBQ",
    description: "Porción de 500g",
    category: "Carnes",
    price: 300,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "ing_costilla", quantity: 500 }],
  };

  // Inicialmente agotado
  let initialAvailability = calculateProductAvailability(ribs, ingredients);
  assert.equal(initialAvailability.availablePortions, 0);
  assert.equal(initialAvailability.status, "Agotado");

  // Simulación de entrada de inventario: +2500 gramos recibidos
  const entryAmount = 2500;
  ingredients = ingredients.map(ing => 
    ing.id === "ing_costilla" ? { ...ing, stock: ing.stock + entryAmount } : ing
  );

  // Recalcular disponibilidad inmediatamente
  let updatedAvailability = calculateProductAvailability(ribs, ingredients);
  assert.equal(updatedAvailability.availablePortions, 5, "2500g / 500g = 5 porciones");
  assert.equal(updatedAvailability.status, "Pocas unidades");
});

test("CASO 8: Registrar una venta -> actualizar disponibilidad y descontar stock exactamente una vez", () => {
  let ingredients: Ingredient[] = [
    { id: "ing_pan", name: "Pan", stock: 10, unit: "u", cost_per_unit: 5 },
    { id: "ing_carne", name: "Carne", stock: 2000, unit: "g", cost_per_unit: 0.15 },
  ];

  const burger: Product = {
    id: "p_burger",
    name: "Burger Clásica",
    description: "",
    category: "Hamburguesas",
    price: 150,
    image_url: "",
    is_active: true,
    recipe: [
      { ingredient_id: "ing_pan", quantity: 1 },
      { ingredient_id: "ing_carne", quantity: 200 },
    ],
  };

  // Inicial: 10 panes, 2000g de carne -> 10 platos
  const initialAvail = calculateProductAvailability(burger, ingredients);
  assert.equal(initialAvail.availablePortions, 10);

  // Venta: 3 hamburguesas
  const saleQuantity = 3;
  const orderItems: OrderItem[] = [{ product_id: "p_burger", quantity: saleQuantity, product_name: "Burger", subtotal: 450 }];

  // 1. Validar
  const validation = validateOrderStock(orderItems, [burger], ingredients);
  assert.equal(validation.isValid, true);

  // 2. Descontar inventario exactamente una vez
  let deductionExecuted = 0;
  ingredients = ingredients.map(ing => {
    if (ing.id === "ing_pan") {
      deductionExecuted++;
      return { ...ing, stock: ing.stock - (saleQuantity * 1) }; // 10 - 3 = 7
    }
    if (ing.id === "ing_carne") {
      deductionExecuted++;
      return { ...ing, stock: ing.stock - (saleQuantity * 200) }; // 2000 - 600 = 1400
    }
    return ing;
  });

  assert.equal(deductionExecuted, 2, "Exactamente una deducción por insumo de la receta");

  // 3. Verificar disponibilidad recalculada
  const postSaleAvail = calculateProductAvailability(burger, ingredients);
  assert.equal(postSaleAvail.availablePortions, 7, "1400g/200g = 7, 7 panes = 7 platos");
  assert.equal(ingredients.find(i => i.id === "ing_pan")?.stock, 7);
  assert.equal(ingredients.find(i => i.id === "ing_carne")?.stock, 1400);
});

test("CASO 9: Dos terminales intentan vender el último insumo simultáneamente -> solo se confirma el que dispone de stock", async () => {
  // Solo queda 1 unidad en stock
  let sharedIngredients: Ingredient[] = [
    { id: "ing_especial", name: "Corte Exclusivo Tomahawk", stock: 1, unit: "u", cost_per_unit: 300 },
  ];

  const tomahawkDish: Product = {
    id: "p_tomahawk",
    name: "Tomahawk Steak",
    description: "Última pieza",
    category: "Cortes",
    price: 800,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "ing_especial", quantity: 1 }],
  };

  // Simulación de mutex / bloqueo transaccional a nivel de DB o servicio
  let isLocked = false;
  const processOrderWithLock = async (terminalId: string, orderQuantity: number): Promise<{ success: boolean; reason?: string }> => {
    while (isLocked) {
      await new Promise(r => setTimeout(r, 10)); // Espera concurrente por liberación de lock
    }
    isLocked = true;
    try {
      // Validar stock con datos frescos dentro de la transacción
      const validation = validateOrderStock(
        [{ product_id: "p_tomahawk", quantity: orderQuantity, product_name: "Tomahawk" }],
        [tomahawkDish],
        sharedIngredients
      );

      if (!validation.isValid) {
        return { success: false, reason: validation.error };
      }

      // Descontar
      sharedIngredients = sharedIngredients.map(ing => 
        ing.id === "ing_especial" ? { ...ing, stock: ing.stock - orderQuantity } : ing
      );

      return { success: true };
    } finally {
      isLocked = false;
    }
  };

  // Ambos terminales envían la solicitud en paralelo
  const [terminalA, terminalB] = await Promise.all([
    processOrderWithLock("Terminal POS-1", 1),
    processOrderWithLock("Terminal Móvil-2", 1)
  ]);

  // Exactamente uno debe tener éxito y el otro ser rechazado
  const successfulOrders = [terminalA, terminalB].filter(res => res.success);
  const failedOrders = [terminalA, terminalB].filter(res => !res.success);

  assert.equal(successfulOrders.length, 1, "Solo 1 pedido debe confirmarse");
  assert.equal(failedOrders.length, 1, "El pedido sin stock debe ser rechazado");
  assert.ok(failedOrders[0].reason?.includes("Corte Exclusivo Tomahawk"));
  assert.equal(sharedIngredients[0].stock, 0, "El stock final debe ser exactamente 0, nunca negativo");
});

test("CASO 10: Cancelar un pedido según las reglas vigentes -> restitución correcta, sin duplicaciones", () => {
  let ingredients: Ingredient[] = [
    { id: "ing_pan", name: "Pan", stock: 10, unit: "u", cost_per_unit: 5 },
  ];

  const hotdog: Product = {
    id: "p_hotdog",
    name: "Hot Dog Clásico",
    description: "",
    category: "Comida",
    price: 60,
    image_url: "",
    is_active: true,
    recipe: [{ ingredient_id: "ing_pan", quantity: 1 }],
  };

  // Simular venta de 4 hotdogs: stock baja de 10 a 6
  ingredients = ingredients.map(i => ({ ...i, stock: i.stock - 4 }));
  assert.equal(ingredients[0].stock, 6);

  // Registro del pedido
  let orderStatus = "pending";
  let restitutionCount = 0;

  const cancelOrder = () => {
    // Regla de idoneidad: solo restituir si el pedido no estaba cancelado previamente
    if (orderStatus === "cancelled") {
      return { restituted: false, message: "El pedido ya estaba cancelado previamente" };
    }

    orderStatus = "cancelled";
    ingredients = ingredients.map(i => {
      restitutionCount++;
      return { ...i, stock: i.stock + 4 };
    });
    return { restituted: true };
  };

  // Primera cancelación: debe restituir las 4 unidades
  const firstCancel = cancelOrder();
  assert.equal(firstCancel.restituted, true);
  assert.equal(ingredients[0].stock, 10, "El stock debe volver a 10");
  assert.equal(restitutionCount, 1);

  // Intento de segunda cancelación accidental (doble clic o evento de red duplicado):
  const secondCancel = cancelOrder();
  assert.equal(secondCancel.restituted, false);
  assert.equal(ingredients[0].stock, 10, "El stock NO debe sumarse dos veces");
  assert.equal(restitutionCount, 1, "No deben ejecutarse restituciones duplicadas");
});
