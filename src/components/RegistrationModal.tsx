"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Trash2 } from "lucide-react";
import styles from "./RegistrationModal.module.css";
import { usePostStore, Post } from "../store/postStore";
import ConfirmModal from "./ConfirmModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: Post | null;
}

export default function RegistrationModal({ isOpen, onClose, postToEdit }: Props) {
  const addPost = usePostStore((state) => state.addPost);
  const updatePost = usePostStore((state) => state.updatePost);

  const [type, setType] = useState<"promotion" | "event" | "notice">("promotion");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [content, setContent] = useState("");
  const [cautions, setCautions] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setAlertOpen(true);
  };

  useEffect(() => {
    if (postToEdit) {
      setType(postToEdit.type);
      setTitle(postToEdit.title);
      setStartDate(postToEdit.start_date);
      setEndDate(postToEdit.end_date);
      setContent(postToEdit.content);
      setCautions(postToEdit.cautions || "");
      setImages(postToEdit.images || []);
    } else {
      resetForm();
    }
  }, [postToEdit, isOpen]);

  const resetForm = () => {
    setType("promotion");
    setTitle("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setContent("");
    setCautions("");
    setImages([]);
    setIsSubmitting(false);
    setIsAiProcessing(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAiAutoFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAiProcessing(true);
    
    try {
      // 1. Convert to compressed image
      const compressedImage = await compressImage(files[0]);
      
      // 2. Add image to list so the user can see it
      setImages((prev) => [...prev, compressedImage]);

      // 3. Call the actual Gemini API route
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedImage })
      });

      if (!response.ok) {
        throw new Error('AI 분석에 실패했습니다.');
      }

      const data = await response.json();
      
      // 4. Fill the form with AI data
      setTitle(data.title || "");
      setContent(data.content || "");
      if (data.cautions) {
        setCautions(data.cautions);
      }
      
    } catch (error) {
      console.error(error);
      showAlert("AI 사진 인식 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsSubmitting(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressImage(files[i]);
      newImages.push(compressed);
    }
    setImages((prev) => [...prev, ...newImages]);
    setIsSubmitting(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showAlert("제목과 내용을 입력해주세요.");
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      showAlert("마감일이 시작일보다 빠릅니다.\n기간을 다시 설정해주세요.");
      return;
    }
    
    // 열기만 하고 실제 로직은 onConfirm에서 처리
    setConfirmOpen(true);
  };

  const executeSubmit = () => {
    setConfirmOpen(false);

    const postData = {
      type,
      title,
      start_date: startDate,
      end_date: endDate,
      content,
      cautions,
      images: images.length > 0 ? images : undefined,
    };

    try {
      if (postToEdit) {
        updatePost(postToEdit.id, postData);
      } else {
        addPost(postData);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      showAlert("등록에 실패했습니다. 사진 용량이 너무 클 수 있습니다.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className={styles.modal}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.header}>
                <h2 className={styles.title}>{postToEdit ? "정보 수정" : "새로운 정보 등록"}</h2>
                <button type="button" className={styles.closeBtn} onClick={onClose}>
                  <X size={24} />
                </button>
              </div>

              {/* AI Auto Fill UI */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#166534', fontWeight: 600 }}>✨ AI로 자동 작성하기</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#15803d' }}>포스터나 공지사항 이미지를 올리면 AI가 내용을 자동으로 채워줍니다!</p>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#00704A', color: 'white', padding: '0.75rem', borderRadius: '6px', cursor: isAiProcessing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: isAiProcessing ? 0.7 : 1 }}>
                  {isAiProcessing ? "AI가 내용을 분석하고 있습니다..." : "📸 사진 업로드하여 자동 채우기"}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAiAutoFill} disabled={isAiProcessing} />
                </label>
              </div>

              <form className={styles.form} onSubmit={handleSubmitClick}>
                <div className={styles.field}>
                  <label className={styles.label}>구분</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" value="notice" checked={type === "notice"} onChange={() => setType("notice")} />
                      공지사항
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" value="promotion" checked={type === "promotion"} onChange={() => setType("promotion")} />
                      프로모션
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" value="event" checked={type === "event"} onChange={() => setType("event")} />
                      이벤트
                    </label>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>제목</label>
                  <input required className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>기간 설정</label>
                  <div className={styles.dateGroup}>
                    <input required type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span>~</span>
                    <input required type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>내용</label>
                  <textarea required className={`${styles.textarea} ${styles.contentArea}`} value={content} onChange={(e) => setContent(e.target.value)} placeholder="상세 내용을 입력하세요" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>유의사항 (선택)</label>
                  <textarea className={styles.textarea} value={cautions} onChange={(e) => setCautions(e.target.value)} placeholder="유의사항이 있다면 입력하세요" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>사진 등록 (선택, 다중선택 가능)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt="Preview" />
                        <button 
                          type="button" 
                          onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'white', border: '1px solid #ccc', borderRadius: '50%', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                    <label style={{ width: '80px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', opacity: isSubmitting ? 0.5 : 1 }}>
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isSubmitting} />
                      <ImagePlus color="#64748b" />
                    </label>
                  </div>
                  {isSubmitting && <span style={{ fontSize: '0.8rem', color: '#00704A' }}>사진 처리 중...</span>}
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {postToEdit ? "수정하기" : "등록하기"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmOpen}
        message={`게시글을 ${postToEdit ? "수정" : "등록"}하시겠습니까?`}
        onConfirm={executeSubmit}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Alert modal (OK only) */}
      <ConfirmModal
        isOpen={alertOpen}
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onCancel={() => setAlertOpen(false)}
      />
    </>
  );
}
