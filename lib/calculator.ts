// Калькулятор стоимости диванов
import { FIXED_DATA, SOFA_MODELS, type SofaModel, type FixedData } from './data';

export type { SofaModel, FixedData };

export interface CalculationResult {
  armrestProductionCost: number;
  backrestProductionCost: number;
  armrestFabricCost: number;
  backrestFabricCost: number;
  total: number;
}

export function getSofaData(): { fixedData: FixedData; models: SofaModel[] } {
  return {
    fixedData: FIXED_DATA,
    models: SOFA_MODELS,
  };
}

/**
 * Вычисляет стоимость производства дивана на основе параметров модели и входных данных
 * 
 * @param model - Модель дивана с параметрами (ширина локтей, коэффициенты)
 * @param backrestWidth - Ширина спинки в сантиметрах (должна быть >= 0)
 * @param fabricPrice - Цена обивки за единицу измерения (должна быть >= 0)
 * @param fabricType - Тип измерения обивки: 'мп' (метры погонные) или 'м2' (метры квадратные)
 * @param fixedData - Фиксированные данные для расчета (по умолчанию используются глобальные константы)
 * @returns Результат расчета с детализацией по статьям затрат
 * @throws {Error} Если входные параметры некорректны
 */
export function calculateSofaCost(
  model: SofaModel,
  backrestWidth: number,
  fabricPrice: number,
  fabricType: 'мп' | 'м2',
  fixedData: FixedData = FIXED_DATA
): CalculationResult {
  // Валидация входных параметров
  if (!model || typeof model.armrestWidth !== 'number' || model.armrestWidth < 0) {
    throw new Error('Invalid model: armrestWidth must be a non-negative number');
  }
  
  if (typeof backrestWidth !== 'number' || backrestWidth < 0 || !isFinite(backrestWidth)) {
    throw new Error('Invalid backrestWidth: must be a non-negative finite number');
  }
  
  if (typeof fabricPrice !== 'number' || fabricPrice < 0 || !isFinite(fabricPrice)) {
    throw new Error('Invalid fabricPrice: must be a non-negative finite number');
  }
  
  if (fabricType !== 'мп' && fabricType !== 'м2') {
    throw new Error('Invalid fabricType: must be either "мп" or "м2"');
  }
  
  if (!fixedData || typeof fixedData.armrestProductionPrice !== 'number') {
    throw new Error('Invalid fixedData: required fields are missing');
  }

  // Расчет стоимости производства локтей
  const armrestProductionCost =
    model.armrestWidth *
    fixedData.armrestProductionPrice *
    model.complexityCoefficient *
    model.markupCoefficient;

  // Расчет стоимости производства спинки
  const backrestProductionCost =
    backrestWidth *
    fixedData.backrestProductionPrice *
    model.complexityCoefficient *
    model.markupCoefficient;

  // Расчет стоимости обивки локтей
  const armrestFabricConsumption =
    fabricType === 'м2'
      ? model.armrestWidth * fixedData.armrestFabricConsumptionM2
      : model.armrestWidth * fixedData.armrestFabricConsumptionMp;
  const armrestFabricCost = armrestFabricConsumption * fabricPrice;

  // Расчет стоимости обивки спинки
  const backrestFabricConsumption =
    fabricType === 'м2'
      ? backrestWidth * fixedData.backrestFabricConsumptionM2
      : backrestWidth * fixedData.backrestFabricConsumptionMp;
  const backrestFabricCost = backrestFabricConsumption * fabricPrice;

  // Итого
  const total =
    armrestProductionCost +
    backrestProductionCost +
    armrestFabricCost +
    backrestFabricCost;

  // Округление до 2 знаков после запятой
  const roundToCents = (value: number): number => Math.round(value * 100) / 100;

  return {
    armrestProductionCost: roundToCents(armrestProductionCost),
    backrestProductionCost: roundToCents(backrestProductionCost),
    armrestFabricCost: roundToCents(armrestFabricCost),
    backrestFabricCost: roundToCents(backrestFabricCost),
    total: roundToCents(total),
  };
}

