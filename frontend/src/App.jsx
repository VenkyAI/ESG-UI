import React, { useEffect, useState } from "react";
import ESGForm from "./components/ESGForm.jsx";

function App() {
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/schema")
      .then((res) => res.json())
      .then((data) => setSchema(data))
      .catch((err) => console.error("Error loading schema:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>🌍 ESG UI</h1>
      {schema ? <ESGForm schema={schema} /> : <p>Loading schema...</p>}
    </div>
  );
}

export default App;
