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

export function calculateSofaCost(
  model: SofaModel,
  backrestWidth: number,
  fabricPrice: number,
  fabricType: 'мп' | 'м2',
  fixedData: FixedData = FIXED_DATA
): CalculationResult {
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

  return {
    armrestProductionCost: Math.round(armrestProductionCost * 100) / 100,
    backrestProductionCost: Math.round(backrestProductionCost * 100) / 100,
    armrestFabricCost: Math.round(armrestFabricCost * 100) / 100,
    backrestFabricCost: Math.round(backrestFabricCost * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

