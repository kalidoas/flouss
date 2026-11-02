import React from 'react';
import {
  Coffee,
  Utensils,
  GraduationCap,
  Dumbbell,
  Laptop,
  Shirt,
  TrendingUp,
  HeartHandshake,
  Briefcase,
  Wrench,
  Gift,
  Coins,
  ShoppingBag,
  Home,
  Car,
  Smartphone,
  Plane,
  Heart,
  Film,
  Book,
  Fuel,
  Music,
  Baby,
  Dog,
  Hammer,
  Sparkles,
  Wallet,
  PiggyBank,
  Target,
  LucideProps,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'Utensils', label: 'Nourriture', icon: Utensils },
  { name: 'Coffee', label: 'Café & Thé', icon: Coffee },
  { name: 'GraduationCap', label: 'Études / Minha', icon: GraduationCap },
  { name: 'Dumbbell', label: 'Sport', icon: Dumbbell },
  { name: 'Laptop', label: 'PC & Tech', icon: Laptop },
  { name: 'Shirt', label: 'Vêtements', icon: Shirt },
  { name: 'TrendingUp', label: 'Investissement', icon: TrendingUp },
  { name: 'HeartHandshake', label: 'Sadaqa & Don', icon: HeartHandshake },
  { name: 'Briefcase', label: 'Travail & Salaire', icon: Briefcase },
  { name: 'Wrench', label: 'Bricolage', icon: Wrench },
  { name: 'Gift', label: 'Cadeau', icon: Gift },
  { name: 'Coins', label: 'Argent & Divers', icon: Coins },
  { name: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
  { name: 'Home', label: 'Logement & Loyer', icon: Home },
  { name: 'Car', label: 'Transport / Voiture', icon: Car },
  { name: 'Fuel', label: 'Carburant', icon: Fuel },
  { name: 'Smartphone', label: 'Téléphone & Wifi', icon: Smartphone },
  { name: 'Plane', label: 'Voyage', icon: Plane },
  { name: 'Film', label: 'Loisirs & Cinéma', icon: Film },
  { name: 'Book', label: 'Livres & Culture', icon: Book },
  { name: 'Music', label: 'Musique', icon: Music },
  { name: 'Heart', label: 'Santé & Médical', icon: Heart },
  { name: 'Baby', label: 'Famille / Enfants', icon: Baby },
  { name: 'Dog', label: 'Animaux', icon: Dog },
  { name: 'Wallet', label: 'Portefeuille', icon: Wallet },
  { name: 'PiggyBank', label: 'Tirelire', icon: PiggyBank },
  { name: 'Target', label: 'Objectif', icon: Target },
  { name: 'Sparkles', label: 'Luxe / Spécial', icon: Sparkles },
];

export const COLOR_OPTIONS: { hex: string; label: string }[] = [
  { hex: '#10b981', label: 'Émeraude' },
  { hex: '#059669', label: 'Vert foncé' },
  { hex: '#14b8a6', label: 'Teal' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#3b82f6', label: 'Bleu' },
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#a855f7', label: 'Pourpre' },
  { hex: '#ec4899', label: 'Rose' },
  { hex: '#f43f5e', label: 'Rose vif' },
  { hex: '#ef4444', label: 'Rouge' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#f59e0b', label: 'Ambre' },
  { hex: '#84cc16', label: 'Lime' },
  { hex: '#64748b', label: 'Ardoise' },
  { hex: '#78716c', label: 'Terre' },
];

export function getCategoryIcon(name?: string | null): React.ComponentType<LucideProps> {
  const match = name ? ICON_OPTIONS.find((item) => item.name === name) : null;
  return match ? match.icon : Wallet;
}
