import { createPortal } from "react-dom";
import "../styles/sales.css";

const ModalWrapper = ({ children }) => {
  return createPortal(
    <div className="fixed inset-0 w-full min-h-screen flex items-center justify-center bg-black/40 z-50">
      {children}
    </div>,
    document.body
  );
};

export default ModalWrapper;
