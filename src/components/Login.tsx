"use client";

import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";
import styles from "./Login.module.css";
import { Coffee } from "lucide-react";
import clsx from "clsx";

export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(pin);
    if (!success) {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div
        className={clsx(styles.card, "glass")}
        initial={{ opacity: 0, y: 20 }}
        animate={error ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={error ? { duration: 0.4 } : { duration: 0.5 }}
      >
        <div className={styles.logo}>
          <Coffee color="white" size={32} />
        </div>
        <div>
          <h1 className={styles.title}>Partner Hub</h1>
          <p className={styles.subtitle}>오늘의 프로모션 & 이벤트</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.inputGroup}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN 번호 입력"
            className={clsx(styles.input, error && styles.inputError)}
            value={pin}
            onChange={(e) => {
              setError(false);
              setPin(e.target.value);
            }}
          />
          <div className={styles.errorText}>
            {error ? "비밀번호가 일치하지 않습니다." : ""}
          </div>
          <button type="submit" className={styles.button}>
            접속하기
          </button>
        </form>
      </motion.div>
    </div>
  );
}
