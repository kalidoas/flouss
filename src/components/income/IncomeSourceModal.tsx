import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { IconPicker } from '../common/IconPicker';
import { ColorPicker } from '../common/ColorPicker';
import { getCategoryIcon } from '../../utils/icons';

interface IncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncomeSourceModal: React.FC<IncomeSourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addIncomeSource } = useAppStore();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Briefcase');
  const [color, setColor] = useState('#059669');
  const [error, setError] = useState('');

  const IconPreview = getCategoryIcon(icon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez entrer un nom de source');
      return;
    }

    addIncomeSource({
      id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      icon,
      color,
      isDefault: false,
      createdAt: new Date().toISOString(),
    });

    setName('');
    setIcon('Briefcase');
    setColor('#059669');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle source de revenu"
      subtitle="Ex: Salaire, Freelance, Bourse, Vente en ligne..."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            <IconPreview className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              {name.trim() || 'Nom de la source'}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Source d’encaissement
            </span>
          </div>
        </div>

        {/* Name */}
        <Input
          label="Nom de la source"
          type="text"
          placeholder="ex: Projet Freelance, Loyer perçu..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
        />

        {/* Color */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Couleur
          </label>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Icône
          </label>
          <IconPicker selectedIcon={icon} onSelect={setIcon} />
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Créer la source
          </Button>
        </div>
      </form>
    </Modal>
  );
};
