import Head from "next/head";
import styles from "./maintanance.module.css";

export default function MaintenancePage() {
  return (
    <>
      <Head>
        <title>Maintenance - 503</title>
      </Head>
      <div className={styles.container}>
        <h1 className={styles.code}>503</h1>
        <h2 className={styles.title}>Situs Sedang Dalam Perawatan</h2>
        <p className={styles.message}>
          Kami sedang melakukan perbaikan sistem untuk meningkatkan layanan.
          Silakan kembali lagi nanti.
        </p>
      </div>
    </>
  );
}
