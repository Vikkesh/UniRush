import React from 'react';
import styles from './modal.module.css';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {title && <h2 className={styles.modalTitle}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal;