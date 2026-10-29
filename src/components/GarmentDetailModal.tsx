import React, { useState } from 'react';
import { X, Save, Trash2, Tag, Palette, Sparkles, Shirt } from 'lucide-react';
import { GarmentItem, CategoryType, StyleType, SeasonType } from '../types/wardrobe';

interface GarmentDetailModalProps {
  item: GarmentItem | null;
  onClose: () => void;
  onSave: (updatedItem: GarmentItem) => void;
  onDelete: (id: string) => void;
}

export const GarmentDetailModal: React.FC<GarmentDetailModalProps> = ({
  item,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!item) return null;

  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState<CategoryType>(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory || '');
  const [color, setColor] = useState(item.color);
  const [style, setStyle] = useState<StyleType>(item.style);
  const [season, setSeason] = useState<SeasonType>(item.season || 'todas');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      title: title.trim() || item.title,
      category,
      subcategory: subcategory.trim(),
      color: color.trim() || item.color,
      style,
      season,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shirt className="w-4 h-4 text-indigo-400" />
            <span>Detalles de Prenda</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview */}
        <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
            {category}
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nombre / Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                <option value="superior">Superior</option>
                <option value="inferior">Inferior</option>
                <option value="calzado">Calzado</option>
                <option value="accesorio">Accesorio</option>
                <option value="abrigo">Abrigo</option>
                <option value="vestido">Vestido</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Estilo</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as StyleType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="sport">Sport</option>
                <option value="fiesta">Fiesta</option>
                <option value="urbano">Urbano</option>
                <option value="elegante">Elegante</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Color Principal</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Temporada</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as SeasonType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                <option value="todas">Todas las estaciones</option>
                <option value="verano">Verano</option>
                <option value="invierno">Invierno</option>
                <option value="primavera">Primavera</option>
                <option value="otoño">Otoño</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Consejo / Notas del Estilista</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de combinación o detalles..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Eliminar definitivamente "${item.title}"?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Prenda</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
