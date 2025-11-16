// Данные из Excel файла калькуляция.xlsx
// Извлечены и сохранены как константы

export interface SofaModel {
  name: string;
  armrestWidth: number; // ширина обоих локтей в см
  complexityCoefficient: number; // коэффициент сложности
  markupCoefficient: number; // коэффициент наценки
}

export interface FixedData {
  armrestProductionPrice: number; // цена производства локтей за 1 см
  backrestProductionPrice: number; // цена производства спинки за 1 см
  armrestFabricConsumptionM2: number; // расход обивки локтей за 1 см в м2
  backrestFabricConsumptionM2: number; // расход обивки спинки за 1 см в м2
  armrestFabricConsumptionMp: number; // расход обивки локтей за 1 см в мп
  backrestFabricConsumptionMp: number; // расход обивки спинки за 1 см в мп
}

// Фиксированные данные по всем моделям диванов
export const FIXED_DATA: FixedData = {
  armrestProductionPrice: 254.59285714285716,
  backrestProductionPrice: 297.025,
  armrestFabricConsumptionM2: 0.07142857142857142,
  backrestFabricConsumptionM2: 0.16666666666666666,
  armrestFabricConsumptionMp: 0.05714285714285714,
  backrestFabricConsumptionMp: 0.1,
};

// Индивидуальные данные по каждой модели
export const SOFA_MODELS: SofaModel[] = [
  { name: 'Chesterfield', armrestWidth: 70, complexityCoefficient: 1, markupCoefficient: 2.5 },
  { name: 'Savoy', armrestWidth: 20, complexityCoefficient: 0.95, markupCoefficient: 2.5 },
  { name: 'Balmoral', armrestWidth: 50, complexityCoefficient: 0.9, markupCoefficient: 2.5 },
  { name: 'Barclay', armrestWidth: 30, complexityCoefficient: 0.85, markupCoefficient: 2.5 },
  { name: 'Viscount', armrestWidth: 20, complexityCoefficient: 0.8, markupCoefficient: 2.5 },
];

