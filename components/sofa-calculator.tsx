'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { calculateSofaCost, getSofaData, type SofaModel, type FixedData } from '@/lib/calculator';

export function SofaCalculator() {
  const [fixedData, setFixedData] = useState<FixedData | null>(null);
  const [models, setModels] = useState<SofaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SofaModel | null>(null);
  const [backrestWidth, setBackrestWidth] = useState<number>(60);
  const [fabricPrice, setFabricPrice] = useState<number>(3000);
  const [fabricType, setFabricType] = useState<'мп' | 'м2'>('мп');

  useEffect(() => {
    // Загружаем данные через API
    fetch('/api/sofa-data')
      .then((res) => res.json())
      .then((data) => {
        setFixedData(data.fixedData);
        setModels(data.models);
        if (data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
      })
      .catch((error) => {
        console.error('Error loading data:', error);
      });
  }, []);

  const calculation = useMemo(() => {
    if (!selectedModel || !fixedData) {
      return null;
    }
    return calculateSofaCost(
      selectedModel,
      backrestWidth,
      fabricPrice,
      fabricType,
      fixedData
    );
  }, [selectedModel, backrestWidth, fabricPrice, fabricType, fixedData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Калькулятор стоимости диванов</h1>
        <p className="text-muted-foreground">
          Рассчитайте стоимость производства дивана с учетом всех параметров
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Левая колонка - Параметры */}
        <Card>
          <CardHeader>
            <CardTitle>Параметры</CardTitle>
            <CardDescription>Введите параметры для расчета стоимости</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="model">Модель дивана</Label>
              <Select
                id="model"
                value={selectedModel?.name || ''}
                onChange={(e) => {
                  const model = models.find((m) => m.name === e.target.value);
                  setSelectedModel(model || null);
                }}
              >
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name} (локти: {model.armrestWidth} см)
                  </option>
                ))}
              </Select>
              {selectedModel && (
                <p className="text-xs text-muted-foreground mt-1">
                  Коэффициент сложности: {selectedModel.complexityCoefficient} × 
                  Наценка: {selectedModel.markupCoefficient}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="backrestWidth">Ширина спинки (см)</Label>
              <Input
                id="backrestWidth"
                type="number"
                min="1"
                value={backrestWidth}
                onChange={(e) => setBackrestWidth(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricPrice">Цена обивки (₽)</Label>
              <Input
                id="fabricPrice"
                type="number"
                min="0"
                step="0.01"
                value={fabricPrice}
                onChange={(e) => setFabricPrice(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabricType">Тип измерения обивки</Label>
              <Select
                id="fabricType"
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value as 'мп' | 'м2')}
              >
                <option value="мп">Метры погонные (мп)</option>
                <option value="м2">Метры квадратные (м²)</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Правая колонка - Результаты */}
        <Card>
          <CardHeader>
            <CardTitle>Расчет стоимости</CardTitle>
            <CardDescription>Детализированный расчет стоимости производства</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Производство локтей:</span>
                    <span className="font-semibold">{formatCurrency(calculation.armrestProductionCost)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Производство спинки:</span>
                    <span className="font-semibold">{formatCurrency(calculation.backrestProductionCost)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Обивка локтей:</span>
                    <span className="font-semibold">{formatCurrency(calculation.armrestFabricCost)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="text-sm font-medium">Обивка спинки:</span>
                    <span className="font-semibold">{formatCurrency(calculation.backrestFabricCost)}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-md">
                    <span className="text-lg font-semibold">Итого:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculation.total)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка данных...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Информационная карточка */}
      {selectedModel && fixedData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Справочная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ширина локтей:</p>
                <p className="font-medium">{selectedModel.armrestWidth} см</p>
              </div>
              <div>
                <p className="text-muted-foreground">Коэф. сложности:</p>
                <p className="font-medium">{selectedModel.complexityCoefficient}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Коэф. наценки:</p>
                <p className="font-medium">{selectedModel.markupCoefficient}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Тип обивки:</p>
                <p className="font-medium">{fabricType === 'мп' ? 'Метры погонные' : 'Метры квадратные'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
