"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, LogOut, Coffee, X } from "lucide-react";
import clsx from "clsx";
import styles from "./MainTracker.module.css";
import { useAuthStore } from "../store/authStore";
import { usePostStore, Post } from "../store/postStore";
import RegistrationModal from "./RegistrationModal";
import ConfirmModal from "./ConfirmModal";

const typeLabel = (type: string) => {
  if (type === "promotion") return "[프로모션] ";
  if (type === "event") return "[이벤트] ";
  if (type === "notice") return "[공지사항] ";
  return "";
};

const Card = ({
  item,
  isAdmin,
  onEdit,
  onDeleteClick,
  onImageClick,
}: {
  item: Post;
  isAdmin: boolean;
  onEdit: (post: Post) => void;
  onDeleteClick: (id: string) => void;
  onImageClick: (url: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div className={styles.card} layout>
      <motion.div className={styles.cardHeader} onClick={() => setIsOpen(!isOpen)} layout>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", overflow: "hidden" }}>
          <span
            className={styles.cardTitle}
            style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {typeLabel(item.type)}
            {item.title}
          </span>
          <span className={styles.cardDateRange} style={{ marginTop: 0, fontSize: "0.8rem" }}>
            {item.start_date.replace(/-/g, ".")} ~ {item.end_date.replace(/-/g, ".")}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} style={{ flexShrink: 0, marginLeft: "0.5rem" }}>
          <ChevronDown size={20} color="#64748b" />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.cardBody}>
              <p className={styles.cardText} style={{ marginTop: "0.5rem" }}>
                {item.content}
              </p>

              {item.images && item.images.length > 0 && (
                <div className={styles.imageGrid}>
                  {item.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`image-${idx}`}
                      className={styles.cardImage}
                      onClick={() => onImageClick(img)}
                    />
                  ))}
                </div>
              )}

              {item.cautions && (
                <div className={styles.cautionBox}>
                  <div className={styles.cautionTitle}>유의사항</div>
                  <div className={styles.cautionText}>{item.cautions}</div>
                </div>
              )}

              {isAdmin && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => onEdit(item)}
                    style={{ flex: 1, padding: "0.6rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", color: "#00704A", fontWeight: 600, cursor: "pointer" }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onDeleteClick(item.id)}
                    style={{ flex: 1, padding: "0.6rem", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function MainTracker() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tab, setTab] = useState<"all" | "notice" | "promotion" | "event">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const posts = usePostStore((state) => state.posts);
  const isLoading = usePostStore((state) => state.isLoading);
  const deletePost = usePostStore((state) => state.deletePost);
  const fetchPosts = usePostStore((state) => state.fetchPosts);
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  const filteredData = posts
    .filter((item) => {
      if (tab !== "all" && item.type !== tab) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!dateStr) return true;
      return item.start_date <= dateStr && dateStr <= item.end_date;
    })
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.end_date.localeCompare(b.end_date)
        : b.end_date.localeCompare(a.end_date)
    );

  const handleEdit = (post: Post) => {
    setPostToEdit(post);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (postToDelete) deletePost(postToDelete);
    setDeleteConfirmOpen(false);
    setPostToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setPostToEdit(null), 300);
  };

  const emptyMessage =
    tab === "all" ? "게시물이" :
    tab === "notice" ? "공지사항이" :
    tab === "promotion" ? "프로모션이" : "이벤트가";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Coffee size={24} />
          <span>Partner Hub</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={20} />
        </button>
      </header>

      <div className={styles.calendarWrapper}>
        <DayPicker mode="single" selected={date} onSelect={setDate} locale={ko} />
      </div>

      <div className={styles.tabs}>
        <button className={clsx(styles.tab, tab === "all" && styles.tabActive)} onClick={() => setTab("all")}>전체</button>
        <button className={clsx(styles.tab, tab === "notice" && styles.tabActive)} onClick={() => setTab("notice")}>공지사항</button>
        <button className={clsx(styles.tab, tab === "promotion" && styles.tabActive)} onClick={() => setTab("promotion")}>프로모션</button>
        <button className={clsx(styles.tab, tab === "event" && styles.tabActive)} onClick={() => setTab("event")}>이벤트</button>
      </div>

      <div className={styles.sortWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="제목 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.sortSelect}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
        >
          <option value="asc">마감일 빠른순</option>
          <option value="desc">마감일 느린순</option>
        </select>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>☕</div>
            <div>데이터를 불러오는 중...</div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDeleteClick={handleDeleteClick}
                  onImageClick={setSelectedImage}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                해당 날짜에 진행 중인 {emptyMessage} 없습니다.
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {isAdmin && (
        <>
          <motion.button
            className={styles.fab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={28} />
          </motion.button>

          <RegistrationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            postToEdit={postToEdit}
          />
        </>
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        message="이 게시글을 정말 삭제하시겠습니까?"
        onConfirm={executeDelete}
        onCancel={() => { setDeleteConfirmOpen(false); setPostToDelete(null); }}
      />

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className={styles.imageViewerBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button className={styles.imageViewerClose} onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            <motion.img
              src={selectedImage}
              className={styles.imageViewerImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
