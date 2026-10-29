import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  Camera,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  Tag,
  Check,
  PackageOpen,
  Image as ImageIcon
} from 'lucide-react';
import { GarmentItem, CategoryType, StyleType } from '../types/wardrobe';

interface WardrobeSectionProps {
  wardrobe: GarmentItem[];
  onUploadFiles: (files: File[]) => void;
  onOpenCamera: () => void;
  onUpdateCategory: (id: string, newCategory: CategoryType) => void;
  onEditItem: (item: GarmentItem) => void;
  onDeleteItem: (id: string) => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

const CATEGORIES: { id: CategoryType | 'todos'; label: string; countKey?: CategoryType }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'superior', label: 'Superiores', countKey: 'superior' },
  { id: 'inferior', label: 'Inferiores', countKey: 'inferior' },
  { id: 'calzado', label: 'Calzado', countKey: 'calzado' },
  { id: 'accesorio', label: 'Accesorios', countKey: 'accesorio' },
  { id: 'abrigo', label: 'Abrigos', countKey: 'abrigo' },
];

export const WardrobeSection: React.FC<WardrobeSectionProps> = ({
  wardrobe,
  onUploadFiles,
  onOpenCamera,
  onUpdateCategory,
  onEditItem,
  onDeleteItem,
  onSeedDemo,
  isSeeding,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('todos');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter items
  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory !== 'todos' && item.category !== selectedCategory) return false;
    if (selectedStyle !== 'todos' && item.style !== selectedStyle) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchColor = item.color.toLowerCase().includes(q);
      const matchSub = (item.subcategory || '').toLowerCase().includes(q);
      const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchColor && !matchSub && !matchTags) return false;
    }
    return true;
  });

  // Calculate counts
  const countByCategory = (cat: CategoryType) => wardrobe.filter((i) => i.category === cat).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      onUploadFiles(fileList);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Banner / Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-slate-900 border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Añadir Prendas a la Nube Permanente
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona una o varias fotos desde tu galería, o arrastra imágenes aquí.
              Nuestra IA comprimirá y clasificará cada prenda automáticamente sin bloqueos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Fotos de Galería</span>
            </button>

            <button
              onClick={onOpenCamera}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Cámara Directa</span>
            </button>

            {wardrobe.length === 0 && (
              <button
                onClick={onSeedDemo}
                disabled={isSeeding}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSeeding ? 'Cargando Demo...' : 'Cargar Armario Demo (8 prendas)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, color, estilo o etiqueta..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Style Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Estilo:</span>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="todos">Todos los estilos</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="sport">Sport</option>
              <option value="fiesta">Fiesta</option>
              <option value="urbano">Urbano</option>
              <option value="elegante">Elegante</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.countKey ? countByCategory(cat.countKey) : wardrobe.length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">No hay prendas que mostrar</h3>
          <p className="text-xs text-slate-400">
            {wardrobe.length === 0
              ? 'Tu armario está vacío. Comienza subiendo fotos de tu ropa.'
              : 'Ninguna prenda coincide con los filtros seleccionados.'}
          </p>
          {wardrobe.length === 0 && (
            <button
              onClick={onSeedDemo}
              disabled={isSeeding}
              className="mt-2 text-xs font-bold text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cargar 8 prendas demo de alta calidad</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <GarmentCard
              key={item.id}
              item={item}
              onUpdateCategory={(newCat) => onUpdateCategory(item.id, newCat)}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface GarmentCardProps {
  item: GarmentItem;
  onUpdateCategory: (newCategory: CategoryType) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const GarmentCard: React.FC<GarmentCardProps> = ({
  item,
  onUpdateCategory,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-2.5 space-y-2.5 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between relative overflow-hidden">
      {/* Image Container */}
      <div
        onClick={onEdit}
        className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950 cursor-pointer"
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Floating Category Badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30 shadow">
            {item.category}
          </span>
        </div>

        {/* Delete Action button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`¿Eliminar "${item.title}" de tu armario permanente?`)) {
              onDelete();
            }
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-md flex items-center justify-center transition shadow opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Eliminar prenda"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Quick Edit Overlay button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-slate-300 hover:text-white backdrop-blur-md flex items-center justify-center transition shadow opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Editar detalles"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Info */}
      <div className="space-y-1.5 px-0.5">
        <div className="flex items-start justify-between gap-1">
          <h4
            onClick={onEdit}
            className="text-xs font-bold text-white truncate hover:text-indigo-300 cursor-pointer"
            title={item.title}
          >
            {item.title}
          </h4>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{item.color}</span>
          <span className="capitalize text-indigo-300 text-[10px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
            {item.style}
          </span>
        </div>

        {/* Category fast selector */}
        <select
          value={item.category}
          onChange={(e) => onUpdateCategory(e.target.value as CategoryType)}
          className="w-full bg-slate-950 text-indigo-300 border border-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer capitalize"
        >
          <option value="superior">Superior</option>
          <option value="inferior">Inferior</option>
          <option value="calzado">Calzado</option>
          <option value="accesorio">Accesorio</option>
          <option value="abrigo">Abrigo</option>
          <option value="vestido">Vestido</option>
        </select>
      </div>
    </div>
  );
};
