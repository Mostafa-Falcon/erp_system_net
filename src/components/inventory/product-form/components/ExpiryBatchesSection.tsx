import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Info, Trash2, Calendar, Plus } from 'lucide-react';
import type { FormBatchEntry, UnitLevelItem, ItemTypeMode } from '../types';

interface ExpiryBatchesSectionProps {
  enableExpiryTracking: boolean;
  setEnableExpiryTracking: (val: boolean) => void;
  batchEntries: FormBatchEntry[];
  itemTypeMode: ItemTypeMode;
  unitLevels: UnitLevelItem[];
  handleAddBatch: () => void;
  handleUpdateBatch: (idx: number, patch: Partial<FormBatchEntry>) => void;
  handleRemoveBatch: (idx: number) => void;
}

export const ExpiryBatchesSection: React.FC<ExpiryBatchesSectionProps> = ({
  enableExpiryTracking,
  setEnableExpiryTracking,
  batchEntries,
  itemTypeMode,
  unitLevels,
  handleAddBatch,
  handleUpdateBatch,
  handleRemoveBatch,
}) => {
  return (
    <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>تواريخ الصلاحية والتشغيلات</span>
          </CardTitle>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              تفعيل تتبع الصلاحية والتشغيلات
            </span>
            <Switch
              checked={enableExpiryTracking}
              onCheckedChange={setEnableExpiryTracking}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {enableExpiryTracking ? (
          <div className="space-y-4">
            {batchEntries.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                <Info className="w-4 h-4 text-slate-400" />
                <span>
                  لم تتم إضافة أي تواريخ صلاحية بعد. اضغط على &apos;[إضافة تاريخ جديد]&apos; بالأسفل.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {batchEntries.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap lg:flex-nowrap items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveBatch(idx)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                      title="حذف هذا التاريخ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-28 shrink-0">
                      <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الكمية
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        step="any"
                        value={b.quantity}
                        onChange={(e) =>
                          handleUpdateBatch(idx, { quantity: e.target.value })
                        }
                        placeholder="1"
                        className="h-10 text-xs font-mono font-bold"
                      />
                    </div>

                    {/* الوحدة المرتبطة: تدعم الوحدات المتعددة للقطع أو الميزان */}
                    <div className="flex-1 min-w-[200px]">
                      <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                        الوحدة المرتبطة
                      </Label>
                      <Select
                        value={b.unitLevelId}
                        onValueChange={(val) =>
                          handleUpdateBatch(idx, { unitLevelId: val })
                        }
                      >
                        <SelectTrigger className="w-full h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold">
                          <SelectValue placeholder="اختر الوحدة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {itemTypeMode === 'unit' ? (
                            <>
                              <SelectItem value="level-1">
                                {unitLevels[0]?.unitName
                                  ? `${unitLevels[0].unitName} (المستوى 1)`
                                  : 'الوحدة الأساسية (المستوى 1)'}
                              </SelectItem>
                              {unitLevels.length > 1 && (
                                <SelectItem value="level-2">
                                  {unitLevels[1]?.unitName
                                    ? `${unitLevels[1].unitName} (المستوى 2)`
                                    : 'المستوى 2'}
                                </SelectItem>
                              )}
                              {unitLevels.length > 2 && (
                                <SelectItem value="level-3">
                                  {unitLevels[2]?.unitName
                                    ? `${unitLevels[2].unitName} (المستوى 3)`
                                    : 'المستوى 3'}
                                </SelectItem>
                              )}
                            </>
                          ) : (
                            <SelectItem value="weight">
                              كيلوجرام (كجم)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* تاريخ الصلاحية: [يوم] [شهر] [سنة] مع أيقونة التقويم */}
                    <div className="flex-1 min-w-[240px]">
                      <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                        تاريخ الصلاحية
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex items-center">
                          <input
                            type="date"
                            value={
                              b.year && b.month && b.day
                                ? `${b.year.padStart(4, '20')}-${b.month.padStart(2, '0')}-${b.day.padStart(2, '0')}`
                                : ''
                            }
                            onChange={(e) => {
                              if (e.target.value) {
                                const [y, m, d] = e.target.value.split('-');
                                handleUpdateBatch(idx, { year: y, month: m, day: d });
                              }
                            }}
                            className="w-10 h-10 p-0 opacity-0 absolute inset-0 cursor-pointer z-10"
                          />
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 pointer-events-none">
                            <Calendar className="w-4 h-4" />
                          </div>
                        </div>

                        <Input
                          type="number"
                          min={2024}
                          max={2040}
                          value={b.year}
                          onChange={(e) =>
                            handleUpdateBatch(idx, { year: e.target.value })
                          }
                          placeholder="سنة"
                          className="h-10 text-xs font-mono font-bold text-center w-20"
                        />

                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={b.month}
                          onChange={(e) =>
                            handleUpdateBatch(idx, { month: e.target.value })
                          }
                          placeholder="شهر"
                          className="h-10 text-xs font-mono font-bold text-center w-16"
                        />

                        <Input
                          type="number"
                          min={1}
                          max={31}
                          value={b.day}
                          onChange={(e) =>
                            handleUpdateBatch(idx, { day: e.target.value })
                          }
                          placeholder="يوم"
                          className="h-10 text-xs font-mono font-bold text-center w-16"
                        />
                      </div>
                    </div>

                    {/* رقم التشغيلة */}
                    <div className="w-36 shrink-0">
                      <Label className="block text-[11px] font-bold text-slate-500 mb-1">
                        رقم التشغيلة
                      </Label>
                      <Input
                        type="text"
                        value={b.batchNumber}
                        onChange={(e) =>
                          handleUpdateBatch(idx, { batchNumber: e.target.value })
                        }
                        placeholder="توليد تلقائي"
                        className="h-10 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddBatch}
                className="h-11 px-6 rounded-xl border-dashed border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تاريخ جديد</span>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-3">
            تتبع الصلاحية متوقف لهذا الصنف حالياً.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
