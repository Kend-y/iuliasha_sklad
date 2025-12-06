"use client";

import { motion } from "framer-motion";
import {
  CubeIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  PlusIcon,
  TrashIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ClockIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { ReactNode } from "react";

// Экспорт иконок для использования в других компонентах
export const Icons = {
  Warehouse: BuildingStorefrontIcon,
  Cube: CubeIcon,
  Orders: ClipboardDocumentListIcon,
  Bell: BellIcon,
  Plus: PlusIcon,
  Trash: TrashIcon,
  Pause: PauseIcon,
  Check: CheckIcon,
  Close: XMarkIcon,
  TrendUp: ArrowTrendingUpIcon,
  TrendDown: ArrowTrendingDownIcon,
  Users: UsersIcon,
  Clock: ClockIcon,
  Warning: ExclamationCircleIcon,
  Info: InformationCircleIcon,
  Success: CheckCircleIcon,
  Error: XCircleIcon,
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  delay?: number;
  glass?: boolean;
  borderColor?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";
}

/**
 * Карточка с анимацией и цветной обводкой
 */
export function Card({
  children,
  className = "",
  onClick,
  hoverable = false,
  delay = 0,
  glass = false,
  borderColor,
}: CardProps) {
  const borderColors = {
    indigo: "border-indigo-200 hover:border-indigo-300",
    emerald: "border-emerald-200 hover:border-emerald-300",
    amber: "border-amber-200 hover:border-amber-300",
    rose: "border-rose-200 hover:border-rose-300",
    violet: "border-violet-200 hover:border-violet-300",
    cyan: "border-cyan-200 hover:border-cyan-300",
  };

  const borderClass = borderColor
    ? `border-2 ${borderColors[borderColor]}`
    : "border border-slate-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        hoverable
          ? {
              y: -2,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      whileTap={hoverable ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.2, delay }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 shadow-sm ${borderClass} ${
        hoverable ? "cursor-pointer hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  trend?: { value: number; isPositive: boolean };
  delay?: number;
  glass?: boolean;
}

/**
 * Карточка статистики с glassmorphism
 */
export function StatCard({
  title,
  value,
  icon,
  color = "blue",
  trend,
  delay = 0,
  glass = false,
}: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-indigo-500",
      border: "border-indigo-200",
      shadow: "shadow-indigo-100",
    },
    green: {
      bg: "bg-emerald-500",
      border: "border-emerald-200",
      shadow: "shadow-emerald-100",
    },
    yellow: {
      bg: "bg-amber-500",
      border: "border-amber-200",
      shadow: "shadow-amber-100",
    },
    red: {
      bg: "bg-rose-500",
      border: "border-rose-200",
      shadow: "shadow-rose-100",
    },
    purple: {
      bg: "bg-violet-500",
      border: "border-violet-200",
      shadow: "shadow-violet-100",
    },
    cyan: {
      bg: "bg-cyan-500",
      border: "border-cyan-200",
      shadow: "shadow-cyan-100",
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${colors.border} ${colors.shadow} flex items-center gap-4`}
    >
      <div className={`p-3 rounded-xl ${colors.bg} text-white`}>
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-slate-800">{value}</p>
          {trend && (
            <span
              className={`text-sm flex items-center gap-1 ${
                trend.isPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "active" | "suspended";
}

/**
 * Бейдж статуса с иконкой
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "В обработке",
      class: "status-pending",
      icon: <ClockIcon className="w-4 h-4" />,
    },
    approved: {
      label: "Одобрен",
      class: "status-approved",
      icon: <CheckCircleIcon className="w-4 h-4" />,
    },
    rejected: {
      label: "Отклонён",
      class: "status-rejected",
      icon: <XCircleIcon className="w-4 h-4" />,
    },
    active: {
      label: "Активен",
      class: "status-active",
      icon: <CheckCircleIcon className="w-4 h-4" />,
    },
    suspended: {
      label: "Приостановлен",
      class: "status-suspended",
      icon: <PauseIcon className="w-4 h-4" />,
    },
  };

  const config = statusConfig[status] || {
    label: status,
    class: "bg-gray-100 text-gray-800",
    icon: null,
  };

  return (
    <motion.span
      className={`status-badge ${config.class} inline-flex items-center gap-1`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
    >
      {config.icon}
      {config.label}
    </motion.span>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

/**
 * Пустое состояние с Heroicons
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <motion.div
        className="w-20 h-20 mx-auto text-gray-300"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <motion.h3
        className="mt-4 text-lg font-medium text-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="mt-2 text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {description}
      </motion.p>
      {action && (
        <motion.button
          onClick={action.onClick}
          className="btn-primary mt-4 inline-flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.icon}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

/**
 * Спиннер загрузки с улучшенной анимацией
 */
export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={`rounded-full border-2 border-gray-200 border-t-primary-600 ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {text && (
        <motion.p
          className="mt-4 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Модальное окно с улучшенными анимациями
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "primary" | "danger";
  confirmIcon?: ReactNode;
}

/**
 * Диалог подтверждения с иконками и анимациями
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Подтвердить",
  confirmVariant = "primary",
  confirmIcon,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <motion.button
          onClick={onClose}
          className="btn-secondary inline-flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <XMarkIcon className="w-4 h-4" />
          Отмена
        </motion.button>
        <motion.button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`${
            confirmVariant === "danger" ? "btn-danger" : "btn-primary"
          } inline-flex items-center gap-2`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {confirmIcon ||
            (confirmVariant === "danger" ? (
              <TrashIcon className="w-4 h-4" />
            ) : (
              <CheckIcon className="w-4 h-4" />
            ))}
          {confirmText}
        </motion.button>
      </div>
    </Modal>
  );
}

/**
 * Анимированная кнопка с иконкой
 */
interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = "secondary",
  size = "md",
  disabled = false,
  className = "",
}: IconButtonProps) {
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
    success: "bg-green-100 text-green-600 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-600 hover:bg-yellow-200",
  };

  const sizeClasses = {
    sm: "p-1.5 text-sm",
    md: "p-2",
    lg: "p-3 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg transition-colors inline-flex items-center gap-2 ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
    >
      <span className={iconSizes[size]}>{icon}</span>
      {label && <span className="font-medium">{label}</span>}
    </motion.button>
  );
}

/**
 * Анимированный список элементов
 */
interface AnimatedListProps {
  children: ReactNode[];
  staggerDelay?: number;
}

export function AnimatedList({
  children,
  staggerDelay = 0.05,
}: AnimatedListProps) {
  return (
    <>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * staggerDelay, duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}

/**
 * Toast-подобный компонент уведомления
 */
interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export function NotificationBadge({ count, max = 9 }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
    >
      {count > max ? `${max}+` : count}
    </motion.span>
  );
}
