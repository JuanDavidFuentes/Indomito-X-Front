'use client';

import {
  LISTING_LIMITS,
  ListingDraftSchema,
  ProductVariantsSchema,
  ShippingOptionSchema,
  type HostListingResponse,
  type ProductVariantDto,
  type ShippingOptionDto,
} from '@juandavidfuentes/indomitox-shared';
import { FloppyDisk, Plus, Trash } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { CheckboxField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { minorToPesos, pesosToMinor, useStoreListing } from '@/lib/listings';
import { emptyLocalized, LocalizedField, type LocalizedValue } from './localized-field';
import type { StepProps } from './step-props';
import { useListingForm } from './use-listing-form';

interface VariantRow {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  stock: string;
  active: boolean;
}

interface ShippingRow {
  key: string;
  id?: string;
  name: string;
  price: string;
  minDays: string;
  maxDays: string;
}

let rowCounter = 0;
const nextKey = () => `row-${(rowCounter += 1)}`;

const toVariantRow = (variant: ProductVariantDto): VariantRow => ({
  key: variant.id,
  id: variant.id,
  size: variant.size ?? '',
  color: variant.color ?? '',
  sku: variant.sku ?? '',
  price: minorToPesos(variant.priceMinor),
  stock: String(variant.stock),
  active: variant.active,
});

const toShippingRow = (option: ShippingOptionDto): ShippingRow => ({
  key: option.id,
  id: option.id,
  name: option.name,
  price: minorToPesos(option.priceMinor),
  minDays: String(option.minDays),
  maxDays: String(option.maxDays),
});

const FIELDS = {
  pickupAvailable: ListingDraftSchema.shape.pickupAvailable,
  shippingAvailable: ListingDraftSchema.shape.shippingAvailable,
  includes: ListingDraftSchema.shape.includes,
};

interface ProductForm {
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  includes: LocalizedValue;
}

/** Celda de una tabla editable con su etiqueta para lectores de pantalla (y visible en el teléfono). */
function CellInput({ label, value, onChange, disabled, inputMode, invalid }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; inputMode?: 'numeric' | 'text'; invalid?: boolean }) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground md:sr-only">
        {label}
      </label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} inputMode={inputMode} aria-invalid={invalid || undefined} className="h-10" />
    </div>
  );
}

/** Variantes del producto (LIST-03): se editan como una tabla y se guardan juntas. */
function VariantsEditor({ data, editable }: { data: HostListingResponse; editable: boolean }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeListing = useStoreListing();
  const { listing } = data;
  const [rows, setRows] = useState<VariantRow[]>(() =>
    listing.variants.length ? listing.variants.map(toVariantRow) : [{ key: nextKey(), size: '', color: '', sku: '', price: '', stock: '0', active: true }],
  );
  const [dirty, setDirty] = useState(listing.variants.length === 0);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<{ index: number; message: string } | null>(null);

  const update = (key: string, patch: Partial<VariantRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setDirty(true);
  };

  const save = async () => {
    const body = {
      variants: rows.map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        size: row.size,
        color: row.color,
        sku: row.sku,
        priceMinor: pesosToMinor(row.price),
        stock: Number(row.stock.replace(/[^\d]/g, '') || 0),
        active: row.active,
      })),
    };
    const parsed = ProductVariantsSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      setProblem({ index: Number(issue.path[1] ?? 0), message: errors.field(issue.message) ?? '' });
      return;
    }
    setProblem(null);
    setSaving(true);
    try {
      const saved = await api<HostListingResponse>(`/v1/host/listings/${listing.id}/variants`, { method: 'PUT', body });
      storeListing(saved);
      setRows(saved.listing.variants.map(toVariantRow));
      setDirty(false);
      toast.success(t('listings.variants.saved'));
    } catch (error) {
      if (error instanceof ApiError && error.issues[0]) {
        setProblem({ index: Number(error.issues[0].path.split('.')[1] ?? 0), message: errors.field(error.issues[0].message) ?? '' });
      } else toast.error(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FieldSet>
      <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.variants.title')}</FieldLegend>
      <p className="-mt-2 text-muted-foreground">{t('listings.variants.hint')}</p>
      <div className="hidden grid-cols-[1fr_1fr_1fr_8rem_6rem_5rem_2.75rem] gap-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase md:grid">
        <span>{t('listings.variants.size')}</span>
        <span>{t('listings.variants.color')}</span>
        <span>{t('listings.variants.sku')}</span>
        <span>{t('listings.variants.price')}</span>
        <span>{t('listings.variants.stock')}</span>
        <span>{t('listings.variants.active')}</span>
        <span className="sr-only">{t('common.remove')}</span>
      </div>
      <ul className="grid gap-3 md:gap-2">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className={`grid grid-cols-2 items-end gap-2 rounded-lg border p-3 md:grid-cols-[1fr_1fr_1fr_8rem_6rem_5rem_2.75rem] md:border-0 md:p-1 ${
              problem?.index === index ? 'border-destructive bg-destructive/5' : 'border-border'
            } ${row.active ? '' : 'opacity-70'}`}
          >
            <CellInput label={t('listings.variants.size')} value={row.size} onChange={(size) => update(row.key, { size })} disabled={!editable} />
            <CellInput label={t('listings.variants.color')} value={row.color} onChange={(color) => update(row.key, { color })} disabled={!editable} />
            <CellInput label={t('listings.variants.sku')} value={row.sku} onChange={(sku) => update(row.key, { sku })} disabled={!editable} />
            <CellInput label={t('listings.variants.price')} value={row.price} onChange={(price) => update(row.key, { price })} disabled={!editable} inputMode="numeric" />
            <CellInput label={t('listings.variants.stock')} value={row.stock} onChange={(stock) => update(row.key, { stock })} disabled={!editable} inputMode="numeric" />
            <label className="flex h-10 items-center gap-2 text-sm font-semibold md:justify-center">
              <Checkbox checked={row.active} onCheckedChange={(checked) => update(row.key, { active: checked === true })} disabled={!editable} />
              <span className="md:sr-only">{t('listings.variants.active')}</span>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('listings.variants.remove', { index: index + 1 })}
              disabled={!editable || rows.length === 1}
              onClick={() => {
                setRows((current) => current.filter((item) => item.key !== row.key));
                setDirty(true);
              }}
            >
              <Trash size={18} aria-hidden="true" />
            </Button>
            {problem?.index === index ? (
              <p role="alert" className="col-span-full text-sm font-medium text-destructive">
                {problem.message}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{t('listings.variants.priceHint')}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!editable || rows.length >= LISTING_LIMITS.variantsMax}
          onClick={() => {
            setRows((current) => [...current, { key: nextKey(), size: '', color: '', sku: '', price: '', stock: '0', active: true }]);
            setDirty(true);
          }}
        >
          <Plus weight="bold" aria-hidden="true" />
          {t('listings.variants.add')}
        </Button>
        <Button type="button" disabled={!editable || !dirty || saving} onClick={() => void save()}>
          {saving ? <Spinner aria-hidden="true" /> : <FloppyDisk size={18} aria-hidden="true" />}
          {t('listings.variants.save')}
        </Button>
      </div>
    </FieldSet>
  );
}

/** Opciones de envío con su costo (lo define el Guía) y días estimados. */
function ShippingEditor({ data, editable, onSave }: { data: HostListingResponse; editable: boolean; onSave: (options: ShippingOptionDto[]) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const [rows, setRows] = useState<ShippingRow[]>(() =>
    data.listing.shippingOptions.length ? data.listing.shippingOptions.map(toShippingRow) : [{ key: nextKey(), name: '', price: '', minDays: '1', maxDays: '3' }],
  );
  const [problem, setProblem] = useState<{ index: number; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const update = (key: string, patch: Partial<ShippingRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setDirty(true);
  };

  const save = () => {
    const options = rows.map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      name: row.name,
      priceMinor: pesosToMinor(row.price) ?? 0,
      minDays: Number(row.minDays || 0),
      maxDays: Number(row.maxDays || 0),
    }));
    for (const [index, option] of options.entries()) {
      const parsed = ShippingOptionSchema.safeParse(option);
      if (!parsed.success) {
        setProblem({ index, message: errors.field(parsed.error.issues[0]?.message) ?? '' });
        return;
      }
    }
    setProblem(null);
    setDirty(false);
    onSave(options as ShippingOptionDto[]);
  };

  return (
    <div className="grid gap-3 rounded-xl border border-border p-4">
      <p className="font-semibold">{t('listings.shipping.options')}</p>
      <ul className="grid gap-3">
        {rows.map((row, index) => (
          <li key={row.key} className={`grid grid-cols-2 items-end gap-2 sm:grid-cols-[2fr_1fr_5rem_5rem_2.75rem] ${problem?.index === index ? 'rounded-lg bg-destructive/5 p-2' : ''}`}>
            <div className="col-span-2 sm:col-span-1">
              <CellInputVisible label={t('listings.shipping.name')} value={row.name} onChange={(name) => update(row.key, { name })} disabled={!editable} />
            </div>
            <CellInputVisible label={t('listings.shipping.price')} value={row.price} onChange={(price) => update(row.key, { price })} disabled={!editable} inputMode="numeric" />
            <CellInputVisible label={t('listings.shipping.minDays')} value={row.minDays} onChange={(minDays) => update(row.key, { minDays })} disabled={!editable} inputMode="numeric" />
            <CellInputVisible label={t('listings.shipping.maxDays')} value={row.maxDays} onChange={(maxDays) => update(row.key, { maxDays })} disabled={!editable} inputMode="numeric" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('listings.shipping.remove', { index: index + 1 })}
              disabled={!editable}
              onClick={() => {
                setRows((current) => current.filter((item) => item.key !== row.key));
                setDirty(true);
              }}
            >
              <Trash size={18} aria-hidden="true" />
            </Button>
            {problem?.index === index ? (
              <p role="alert" className="col-span-full text-sm font-medium text-destructive">
                {problem.message}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!editable || rows.length >= LISTING_LIMITS.shippingOptionsMax}
          onClick={() => {
            setRows((current) => [...current, { key: nextKey(), name: '', price: '', minDays: '1', maxDays: '3' }]);
            setDirty(true);
          }}
        >
          <Plus weight="bold" aria-hidden="true" />
          {t('listings.shipping.add')}
        </Button>
        <Button type="button" disabled={!editable || !dirty} onClick={save}>
          <FloppyDisk size={18} aria-hidden="true" />
          {t('listings.shipping.save')}
        </Button>
      </div>
    </div>
  );
}

function CellInputVisible({ label, value, onChange, disabled, inputMode }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; inputMode?: 'numeric' | 'text' }) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} inputMode={inputMode} className="h-10" />
    </div>
  );
}

/** Paso 3 de los productos: variantes con stock y cómo se entrega (LIST-03). */
export function StepProduct({ data, editable }: StepProps) {
  const t = useTranslations();
  const { listing } = data;
  const { form, autosave } = useListingForm<ProductForm>(
    listing.id,
    FIELDS,
    { pickupAvailable: listing.pickupAvailable, shippingAvailable: listing.shippingAvailable, includes: emptyLocalized(listing.includes) },
    { disabled: !editable },
  );
  const shipping = useWatch({ control: form.control, name: 'shippingAvailable' });

  return (
    <div className="grid gap-10">
      <AutosaveIndicator status={autosave.status} />
      <VariantsEditor data={data} editable={editable} />
      <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-6">
        <FieldSet>
          <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.shipping.title')}</FieldLegend>
          <p className="-mt-2 text-muted-foreground">{t('listings.shipping.hint')}</p>
          <CheckboxField control={form.control} name="pickupAvailable" label={t('listings.shipping.pickup')} />
          <CheckboxField control={form.control} name="shippingAvailable" label={t('listings.shipping.shipping')} />
          {shipping ? <ShippingEditor data={data} editable={editable} onSave={(options) => autosave.queue({ shippingOptions: options }, true)} /> : null}
        </FieldSet>
        <LocalizedField
          control={form.control}
          name="includes"
          label={`${t('listings.fields.productIncludes')} (${t('common.optional')})`}
          description={t('listings.fields.oneItemPerLine')}
          multiline
          rows={3}
          maxLength={2000}
        />
      </form>
    </div>
  );
}
