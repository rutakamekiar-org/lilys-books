"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./NovaPoshtaWidget.module.css";

interface NovaPoshtaWidgetProps {
  onSelect: (data: NovaPoshtaDepartment) => void;
  value?: NovaPoshtaDepartment | null;
}

export interface NovaPoshtaDepartment {
  id: string;
  shortName: string;
  address: string;
  addressParts?: {
    city?: string;
    street?: string;
    building?: string;
  };
}

export default function NovaPoshtaWidget({ onSelect, value }: NovaPoshtaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<NovaPoshtaDepartment | null>(value || null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDepartment(value);
    }
  }, [value]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://widget.novapost.com') {
        return;
      }

      if (event.data === 'closeFrame') {
        setIsOpen(false);
        return;
      }

      if (event.data && typeof event.data === 'object' && event.data.id) {
        const department: NovaPoshtaDepartment = {
          id: event.data.id,
          shortName: event.data.shortName || '',
          address: event.data.address || '',
          addressParts: event.data.addressParts,
        };
        setSelectedDepartment(department);
        onSelect(department);
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onSelect]);

  const openWidget = () => {
    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
    if (iframeRef.current) {
      iframeRef.current.src = '';
    }
  };

  useEffect(() => {
    if (isOpen && iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.src = 'https://widget.novapost.com/division/index.html';

      iframe.onload = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const data = {
                placeName: 'Київ',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                domain: window.location.hostname,
                id: selectedDepartment?.id || null,
              };
              iframe.contentWindow?.postMessage(data, '*');
            },
            () => {
              // Fallback without geolocation
              const data = {
                placeName: 'Київ',
                domain: window.location.hostname,
                id: selectedDepartment?.id || null,
              };
              iframe.contentWindow?.postMessage(data, '*');
            }
          );
        } else {
          const data = {
            placeName: 'Київ',
            domain: window.location.hostname,
            id: selectedDepartment?.id || null,
          };
          iframe.contentWindow?.postMessage(data, '*');
        }
      };
    }
  }, [isOpen, selectedDepartment?.id]);

  const displayText = selectedDepartment?.shortName || '';
  const displayDescription = selectedDepartment
    ? `${selectedDepartment.addressParts?.city || ''} вул. ${selectedDepartment.addressParts?.street || ''}, ${selectedDepartment.addressParts?.building || ''}`
    : 'Обрати відділення або поштомат';

  return (
    <>
      <button type="button" className={styles.button} onClick={openWidget}>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.9401 16.4237H16.0596V21.271H19.2101L15.39 25.0911C14.6227 25.8585 13.3791 25.8585 12.6118 25.0911L8.79166 21.271H11.9401V16.4237ZM21.2688 19.2102V8.78972L25.091 12.6098C25.8583 13.3772 25.8583 14.6207 25.091 15.3881L21.2688 19.2102ZM16.0596 6.73099V11.5763H11.9401V6.73099H8.78958L12.6097 2.90882C13.377 2.14148 14.6206 2.14148 15.3879 2.90882L19.2101 6.73099H16.0596ZM2.90868 12.6098L6.72877 8.78972V19.2102L2.90868 15.3901C2.14133 14.6228 2.14133 13.3772 2.90868 12.6098Z" fill="#DA291C"/>
          </svg>
        </div>
        <div className={styles.textWrapper}>
          {displayText && <span className={styles.text}>{displayText}</span>}
          <span className={styles.description}>{displayDescription}</span>
        </div>
        <div className={styles.arrow}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M5.49399 1.44891L10.0835 5.68541L10.1057 5.70593C10.4185 5.99458 10.6869 6.24237 10.8896 6.4638C11.1026 6.69642 11.293 6.95179 11.4023 7.27063C11.5643 7.74341 11.5643 8.25668 11.4023 8.72946C11.293 9.0483 11.1026 9.30367 10.8896 9.53629C10.6869 9.75771 10.4184 10.0055 10.1057 10.2942L10.0835 10.3147L5.49398 14.5511L4.47657 13.4489L9.06607 9.21246C9.40722 8.89756 9.62836 8.69258 9.78328 8.52338C9.93272 8.36015 9.96962 8.28306 9.98329 8.24318C10.0373 8.08559 10.0373 7.9145 9.98329 7.7569C9.96963 7.71702 9.93272 7.63993 9.78328 7.4767C9.62837 7.3075 9.40722 7.10252 9.06608 6.78761L4.47656 2.55112L5.49399 1.44891Z" fill="#475569"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeWidget();
        }}>
          <div className={styles.modal}>
            <header className={styles.header}>
              <h2>Вибрати відділення</h2>
              <button className={styles.closeBtn} onClick={closeWidget}>×</button>
            </header>
            <iframe
              ref={iframeRef}
              className={styles.iframe}
              allow="geolocation"
              title="Nova Poshta Widget"
            />
          </div>
        </div>
      )}
    </>
  );
}
