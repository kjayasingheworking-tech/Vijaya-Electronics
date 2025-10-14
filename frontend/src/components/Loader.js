export default function Loader(){
  return (
    <div style={{display:'grid',placeItems:'center',padding:'40px'}}>
      <div className="spinner"/>
      <style>{`
        .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.2);border-top-color:#FFA500;border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}
