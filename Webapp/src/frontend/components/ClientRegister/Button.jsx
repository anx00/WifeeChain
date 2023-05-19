import React from "react";

function CopyButton({ text }) {
  // Función para copiar el texto al portapapeles
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert("Texto copiado");
  };

  // Objeto con los estilos del botón
  const buttonStyle = {
    backgroundColor: "blue",
    color: "white",
    fontSize: "18px",
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer"
  };

  return (
    <button style={buttonStyle} onClick={handleCopy}>Copiar</button>
  );
}

export default CopyButton;