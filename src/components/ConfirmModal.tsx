"use client";

import { motion, AnimatePresence } from "framer-motion";
import styles from "./ConfirmModal.module.css";

interface Props {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={styles.message}>{message}</div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onCancel}>
                취소
              </button>
              <button className={styles.confirmBtn} onClick={onConfirm}>
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
