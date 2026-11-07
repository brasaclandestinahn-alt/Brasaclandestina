import type { Product, Ingredient } from "./mockDB";

export type AvailabilityStatus =
  | "Disponible"
  | "Pocas unidades"
  | "Agotado"
  | "Sin receta / Configuración incompleta"
  | "Sin seguimiento";

export interface ProductAvailabilityResult {
  productId: string;
  availablePortions: number;
  status: AvailabilityStatus;
  limitingIngredients: string[];
  missingIngredients: string[];
  recipeValid: boolean;
}

/**
 * Motor puro y determinista para calcular la disponibilidad real de un producto
 * a partir de las existencias de inventario en Supabase / memoria.
 */
export function calculateProductAvailability(
  product: Product | null | undefined,
  ingredients: Ingredient[]
): ProductAvailabilityResult {
  if (!product) {
    return {
      productId: "",
      availablePortions: 0,
      status: "Sin receta / Configuración incompleta",
      limitingIngredients: [],
      missingIngredients: [],
      recipeValid: false,
    };
  }

  const productId = product.id;

  // REQUISITO 11: Distinguir productos exceptuados del seguimiento de inventario
  if (product.inventory_tracking === "none") {
    const isAvailable = product.is_active;
    return {
      productId,
      availablePortions: isAvailable ? 999 : 0,
      status: "Sin seguimiento",
      limitingIngredients: [],
      missingIngredients: [],
      recipeValid: true,
    };
  }

  // Soporte para productos de inventario directo (bebidas empaquetadas, latas, etc.)
  if (product.inventory_tracking === "direct" || product.direct_ingredient_id) {
    if (!product.direct_ingredient_id) {
      return {
        productId,
        availablePortions: 0,
        status: "Sin receta / Configuración incompleta",
        limitingIngredients: [],
        missingIngredients: ["direct_ingredient_not_specified"],
        recipeValid: false,
      };
    }

    const directIng = ingredients.find((i) => i.id === product.direct_ingredient_id);
    if (!directIng) {
      return {
        productId,
        availablePortions: 0,
        status: "Sin receta / Configuración incompleta",
        limitingIngredients: [],
        missingIngredients: [product.direct_ingredient_id],
        recipeValid: false,
      };
    }

    // REQUISITO 6: Evitar NaN, negativos o infinitos
    const rawStock = Number(directIng.stock);
    const safeStock = Number.isFinite(rawStock) && !isNaN(rawStock) && rawStock > 0
      ? Math.floor(rawStock)
      : 0;

    // REQUISITO 13: Contemplar productos inactivos
    const availablePortions = product.is_active ? safeStock : 0;

    let status: AvailabilityStatus;
    if (availablePortions === 0) {
      status = "Agotado";
    } else if (availablePortions <= 5) {
      status = "Pocas unidades";
    } else {
      status = "Disponible";
    }

    return {
      productId,
      availablePortions,
      status,
      limitingIngredients: availablePortions <= 5 ? [directIng.name] : [],
      missingIngredients: [],
      recipeValid: true,
    };
  }

  // REQUISITO 10: Si no existe receta, mostrar "Sin receta", nunca inventar 99 unidades
  if (!product.recipe || !Array.isArray(product.recipe) || product.recipe.length === 0) {
    return {
      productId,
      availablePortions: 0,
      status: "Sin receta / Configuración incompleta",
      limitingIngredients: [],
      missingIngredients: [],
      recipeValid: false,
    };
  }

  // REQUISITO 7: Consolidar recetas con insumos duplicados sumando su consumo
  // REQUISITO 8: Validar que cada cantidad de receta sea mayor que cero
  const consolidatedRecipe = new Map<string, number>();
  let hasInvalidQuantity = false;

  for (const item of product.recipe) {
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || isNaN(qty) || qty <= 0) {
      hasInvalidQuantity = true;
      break;
    }

    const currentQty = consolidatedRecipe.get(item.ingredient_id) || 0;
    consolidatedRecipe.set(item.ingredient_id, currentQty + qty);
  }

  if (hasInvalidQuantity || consolidatedRecipe.size === 0) {
    return {
      productId,
      availablePortions: 0,
      status: "Sin receta / Configuración incompleta",
      limitingIngredients: [],
      missingIngredients: [],
      recipeValid: false,
    };
  }

  // REQUISITO 1 & 9: Consultar todos sus ingredientes por ID. Si uno falta, marcar inválida/incompleta
  const missingIngredients: string[] = [];
  const ingredientPortionsMap = new Map<string, { name: string; portions: number }>();

  for (const [ingredientId, requiredQty] of consolidatedRecipe.entries()) {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) {
      missingIngredients.push(ingredientId);
      continue;
    }

    // REQUISITO 2, 3 & 6: Dividir stock disponible entre cantidad requerida, redondear abajo, no permitir < 0 o NaN
    const rawStock = Number(ing.stock);
    const safeStock = Number.isFinite(rawStock) && !isNaN(rawStock) && rawStock > 0 ? rawStock : 0;
    const portions = Math.floor(safeStock / requiredQty);
    const safePortions = Number.isFinite(portions) && !isNaN(portions) && portions >= 0 ? portions : 0;

    ingredientPortionsMap.set(ingredientId, {
      name: ing.name,
      portions: safePortions,
    });
  }

  if (missingIngredients.length > 0) {
    return {
      productId,
      availablePortions: 0,
      status: "Sin receta / Configuración incompleta",
      limitingIngredients: [],
      missingIngredients,
      recipeValid: false,
    };
  }

  // REQUISITO 4: El menor resultado determina las porciones disponibles
  let minPortions = Infinity;
  for (const item of ingredientPortionsMap.values()) {
    if (item.portions < minPortions) {
      minPortions = item.portions;
    }
  }

  if (minPortions === Infinity) {
    minPortions = 0;
  }

  // REQUISITO 5: Identificar ingredientes limitantes (aquellos con el valor mínimo)
  const limitingIngredients: string[] = [];
  for (const item of ingredientPortionsMap.values()) {
    if (item.portions === minPortions && !limitingIngredients.includes(item.name)) {
      limitingIngredients.push(item.name);
    }
  }

  // REQUISITO 13: Contemplar productos inactivos
  const availablePortions = product.is_active ? minPortions : 0;

  // Determinación de Estado
  let status: AvailabilityStatus;
  if (availablePortions === 0) {
    status = "Agotado";
  } else if (availablePortions <= 5) {
    status = "Pocas unidades";
  } else {
    status = "Disponible";
  }

  return {
    productId,
    availablePortions,
    status,
    limitingIngredients,
    missingIngredients: [],
    recipeValid: true,
  };
}

export interface OrderStockValidationResult {
  isValid: boolean;
  error?: string;
  insufficientIngredients: {
    ingredientId: string;
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
  }[];
  aggregatedConsumption: Map<string, number>;
}

/**
 * Valida un pedido completo antes de confirmarlo, sumando el consumo
 * agregado de insumos compartidos entre productos diferentes.
 * Si no alcanza el stock de algún insumo, rechaza la operación completa.
 */
export function validateOrderStock(
  items: { product_id: string; quantity: number; product_name?: string }[],
  products: Product[],
  ingredients: Ingredient[]
): OrderStockValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: true,
      insufficientIngredients: [],
      aggregatedConsumption: new Map(),
    };
  }

  const consumptionMap = new Map<string, number>();

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const product = products.find((p) => p.id === item.product_id);

    if (!product) {
      return {
        isValid: false,
        error: `El producto "${item.product_name || item.product_id}" no existe en el catálogo activo.`,
        insufficientIngredients: [],
        aggregatedConsumption: consumptionMap,
      };
    }

    // 1. Producto sin seguimiento (servicios / ilimitado)
    if (product.inventory_tracking === "none") {
      continue;
    }

    // 2. Producto directo (bebidas, botellas, latas)
    if (product.inventory_tracking === "direct" || product.direct_ingredient_id) {
      if (!product.direct_ingredient_id) {
        return {
          isValid: false,
          error: `El producto "${product.name}" está marcado como insumo directo pero no tiene un insumo vinculado.`,
          insufficientIngredients: [],
          aggregatedConsumption: consumptionMap,
        };
      }
      const prev = consumptionMap.get(product.direct_ingredient_id) || 0;
      consumptionMap.set(product.direct_ingredient_id, prev + item.quantity);
      continue;
    }

    // 3. Producto con receta de cocina
    if (!product.recipe || product.recipe.length === 0) {
      return {
        isValid: false,
        error: `El platillo "${product.name}" no tiene receta configurada. No se puede vender sin control de inventario.`,
        insufficientIngredients: [],
        aggregatedConsumption: consumptionMap,
      };
    }

    for (const rec of product.recipe) {
      const recQty = Number(rec.quantity);
      if (recQty <= 0 || isNaN(recQty)) continue;
      const totalForItem = item.quantity * recQty;
      const prev = consumptionMap.get(rec.ingredient_id) || 0;
      consumptionMap.set(rec.ingredient_id, prev + totalForItem);
    }
  }

  // Verificar consumo acumulado contra el stock real en inventario
  const insufficientIngredients: {
    ingredientId: string;
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
  }[] = [];

  for (const [ingredientId, requiredQty] of consumptionMap.entries()) {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) {
      insufficientIngredients.push({
        ingredientId,
        ingredientName: `Insumo #${ingredientId} (No registrado)`,
        required: requiredQty,
        available: 0,
        unit: "u",
      });
      continue;
    }

    const currentStock = Math.max(0, Number(ing.stock) || 0);
    if (requiredQty > currentStock) {
      insufficientIngredients.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        required: requiredQty,
        available: currentStock,
        unit: ing.unit,
      });
    }
  }

  if (insufficientIngredients.length > 0) {
    const errorDetails = insufficientIngredients
      .map(
        (i) =>
          `"${i.ingredientName}" (requerido: ${i.required} ${i.unit}, disponible: ${i.available} ${i.unit})`
      )
      .join(", ");

    return {
      isValid: false,
      error: `Stock insuficiente en el pedido: ${errorDetails}.`,
      insufficientIngredients,
      aggregatedConsumption: consumptionMap,
    };
  }

  return {
    isValid: true,
    insufficientIngredients: [],
    aggregatedConsumption: consumptionMap,
  };
}

/**
 * Helper optimizado para obtener un mapa completo de disponibilidad
 * para un catálogo de productos.
 */
export function calculateCatalogAvailability(
  products: Product[],
  ingredients: Ingredient[]
): Map<string, ProductAvailabilityResult> {
  const map = new Map<string, ProductAvailabilityResult>();
  for (const product of products) {
    map.set(product.id, calculateProductAvailability(product, ingredients));
  }
  return map;
}
