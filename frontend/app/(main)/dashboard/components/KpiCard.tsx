"use client";

import styles from "./KpiCard.module.css";

import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

type HeroIcon = typeof CurrencyDollarIcon;

interface Props {
  titulo: string;
  valor: string | number;
  color?: string;
  icon: HeroIcon;
}

export default function KpiCard({
  titulo,
  valor,
  color = "#111827",
  icon: Icon,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.titulo}>{titulo}</span>

          <h2 className={styles.valor} style={{ color }}>
            {valor}
          </h2>
        </div>

        <div
          className={styles.iconContainer}
          style={{
            background: `${color}15`,
          }}
        >
          <Icon
            className={styles.icon}
            style={{
              color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
