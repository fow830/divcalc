'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { calculateSofaCost, type SofaModel, type FixedData } from '@/lib/calculator';
import { VersionBadge } from '@/components/version-badge';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface DataLoadError {
  message: string;
  retry?: () => void;
}

export function SofaCalculator() {
  const [fixedData, setFixedData] = useState<FixedData | null>(null);
  const [models, setModels] = useState<SofaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SofaModel | null>(null);
  const [backrestWidthInput, setBackrestWidthInput] = useState<string>('60');
  const [lastBackrestWidth, setLastBackrestWidth] = useState<string>('60');
  const [fabricPriceInput, setFabricPriceInput] = useState<string>('3000');
  const [lastFabricPrice, setLastFabricPrice] = useState<string>('3000');
  const [fabricType, setFabricType] = useState<'мп' | 'м2'>('мп');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<DataLoadError | null>(null);

  const loadData = useCallback(async () => {
    setLoadingState('loading');
    setError(null);
    
    try {
      const response = await fetch('/api/sofa-data');
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки данных: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.fixedData || !data.models || !Array.isArray(data.models)) {
        throw new Error('Неверный формат данных от сервера');
      }
      
      setFixedData(data.fixedData);
      setModels(data.models);
      
      if (data.models.length > 0) {
        setSelectedModel(data.models[0]);
      } else {
        throw new Error('Нет доступных моделей диванов');
      }
      
      setLoadingState('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке данных';
      setError({
        message: errorMessage,
        retry: loadData,
      });
      setLoadingState('error');
      console.error('Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Валидация и преобразование входных данных
  const backrestWidth = useMemo(() => {
    const value = backrestWidthInput === '' ? 0 : Number(backrestWidthInput);
    return isNaN(value) || value < 0 ? 0 : Math.min(value, 999);
  }, [backrestWidthInput]);

  const fabricPrice = useMemo(() => {
    const value = fabricPriceInput === '' ? 0 : Number(fabricPriceInput);
    return isNaN(value) || value < 0 ? 0 : value;
  }, [fabricPriceInput]);

  const calculation = useMemo(() => {
    if (!selectedModel || !fixedData) {
      return null;
    }
    
    try {
      return calculateSofaCost(
        selectedModel,
        backrestWidth,
        fabricPrice,
        fabricType,
        fixedData
      );
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [selectedModel, backrestWidth, fabricPrice, fabricType, fixedData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const stripLeadingZeros = (value: string) => {
    if (value.length <= 1) return value;
    return value.replace(/^0+(?=\d)/, '');
  };

  const handleBackrestWidthChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
    const sanitized = stripLeadingZeros(digitsOnly);
    setBackrestWidthInput(sanitized);
    if (sanitized && sanitized !== '0') {
      setLastBackrestWidth(sanitized);
    }
  };

  const handleFabricPriceChange = (value: string) => {
    let sanitized = value.replace(/[^\d.,]/g, '').replace(',', '.');
    // Ограничение до 5 символов
    if (sanitized.length > 5) {
      sanitized = sanitized.slice(0, 5);
    }
    if (sanitized.includes('.')) {
      const [whole, ...rest] = sanitized.split('.');
      const normalizedWhole = stripLeadingZeros(whole) || '0';
      sanitized = `${normalizedWhole}.${rest.join('')}`;
      // Проверяем общую длину после нормализации
      if (sanitized.length > 5) {
        sanitized = sanitized.slice(0, 5);
      }
    } else {
      sanitized = stripLeadingZeros(sanitized);
    }
    setFabricPriceInput(sanitized);
    if (sanitized) {
      setLastFabricPrice(sanitized);
    }
  };

  const handleBackrestWidthFocus = () => {
    setBackrestWidthInput('');
  };

  const handleBackrestWidthBlur = () => {
    if (!backrestWidthInput || backrestWidthInput === '0') {
      setBackrestWidthInput(lastBackrestWidth || '1');
    }
  };

  const handleFabricPriceFocus = () => {
    setFabricPriceInput('');
  };

  const handleFabricPriceBlur = () => {
    if (!fabricPriceInput || fabricPriceInput === '0' || fabricPriceInput === '.') {
      setFabricPriceInput(lastFabricPrice || '0');
    }
  };

  // Состояние загрузки или ошибки
  if (loadingState === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-muted-foreground">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  if (loadingState === 'error' && error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Ошибка загрузки данных</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            {error.retry && (
              <button
                onClick={error.retry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Попробовать снова
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="backrestWidth">Ширина спинки (см)</Label>
              <Input
                id="backrestWidth"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                value={backrestWidthInput}
                placeholder="Введите ширину спинки"
                onFocus={handleBackrestWidthFocus}
                onBlur={handleBackrestWidthBlur}
                onChange={(e) => handleBackrestWidthChange(e.target.value)}
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="fabricPrice">Цена обивки (₽)</Label>
              <Input
                id="fabricPrice"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*([.,][0-9]*)?"
                maxLength={5}
                value={fabricPriceInput}
                placeholder="Стоимость за единицу обивки"
                onFocus={handleFabricPriceFocus}
                onBlur={handleFabricPriceBlur}
                onChange={(e) => handleFabricPriceChange(e.target.value)}
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
                Выберите модель дивана для расчета
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
      <VersionBadge />
    </div>
  );
}
