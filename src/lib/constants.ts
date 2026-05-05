import { PaymentMethodConfig } from '../types';

export const DEFAULT_APP_PAYMENTS: PaymentMethodConfig[] = [
  { id: 'jahez', label: 'Jahez (جاهز)', requiresImage: true, isActive: true },
  { id: 'hungerstation', label: 'HungerStation (هنقرستيشن)', requiresImage: true, isActive: true },
  { id: 'toyou', label: 'Toyou (كيتا)', requiresImage: true, isActive: true },
  { id: 'club', label: 'Club (كلوب)', requiresImage: true, isActive: true },
  { id: 'ninja', label: 'Ninja (نينجا)', requiresImage: true, isActive: true }
];
