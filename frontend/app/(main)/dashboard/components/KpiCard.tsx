import styles from "./KpiCard.module.css";

interface Props {
  titulo: string;
  valor: string | number;
  color?: string;
}

export default function KpiCard({
  titulo,
  valor,
  color = "#111827",
}: Props) {
  return (
    <div className={styles.card}>
      <span className={styles.titulo}>{titulo}</span>

      <h2
        className={styles.valor}
        style={{ color }}
      >
        {valor}
      </h2>
    </div>
  );
}