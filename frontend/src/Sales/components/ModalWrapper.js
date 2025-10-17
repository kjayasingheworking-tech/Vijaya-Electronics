import { createPortal } from "react-dom";
import "../styles/sales.css";

const ModalWrapper = ({ children }) => {
  return createPortal(
    <>
      {/* Main modal overlay */}
      <div className="fixed inset-0 w-full min-h-screen flex items-center justify-center bg-black/50 z-[1001]">
        {children}
      </div>
        {/* Navigation overlay to darken the sidebar */}
        <div 
          className="fixed bg-black/5 z-[1000]"
          style={{
            left: '0',
            top: '80px',
            width: '256px',
            height: 'calc(100vh - 80px)',
          }}
        />
    </>,
    document.body
  );
};

export default ModalWrapper;
