const API_BASE = "https://api-estudiantes-fernando-hvg0e4a3caatf0hp.eastus-01.azurewebsites.net";

async function loadStudents() {
  const loading  = document.getElementById("loading");
  const emptyMsg = document.getElementById("empty-msg");
  const tbody    = document.getElementById("table-body");

  loading.style.display  = "block";
  emptyMsg.style.display = "none";
  tbody.innerHTML = "";

  try {
    const res  = await fetch(`${API_BASE}/api/students`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loading.style.display = "none";

    if (data.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    data.forEach((student, index) => {
      const tr = document.createElement("tr");
      tr.style.animationDelay = `${index * 0.05}s`;
      tr.innerHTML = `
        <td>${student.id}</td>
        <td>${escapeHtml(student.nombres)}</td>
        <td>${escapeHtml(student.apellidos)}</td>
        <td>${escapeHtml(student.numeroCarnet)}</td>
        <td>${student.edad}</td>
        <td>
          <button class="btn-delete" onclick="deleteStudent(${student.id}, this)">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    loading.style.display = "none";
    emptyMsg.textContent   = `Error al cargar estudiantes: ${err.message}`;
    emptyMsg.style.display = "block";
    console.error(err);
  }
}

// =============================================
//  CREAR ESTUDIANTE (POST)
// =============================================
async function createStudent() {
  const nombres   = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const carnet    = document.getElementById("carnet").value.trim();
  const edad      = document.getElementById("edad").value.trim();
  const msgEl     = document.getElementById("form-msg");

  // Validación básica
  if (!nombres || !apellidos || !carnet || !edad) {
    showMsg(msgEl, "Por favor completa todos los campos.", "error");
    return;
  }
  if (isNaN(edad) || parseInt(edad) < 1) {
    showMsg(msgEl, "La edad debe ser un número válido.", "error");
    return;
  }

  const btn = document.querySelector(".btn-add");
  btn.disabled = true;
  btn.textContent = "Agregando...";

  try {
    const res = await fetch(`${API_BASE}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombres,
        apellidos,
        numeroCarnet: carnet,
        edad: parseInt(edad)
      })
    });

    const data = await res.json();

    if (res.ok) {
      showMsg(msgEl, "✓ Estudiante agregado correctamente.", "success");
      clearForm();
      loadStudents();
    } else {
      showMsg(msgEl, `Error: ${data.error || "No se pudo agregar."}`, "error");
    }

  } catch (err) {
    showMsg(msgEl, `Error de conexión: ${err.message}`, "error");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>+</span> Agregar Estudiante`;
  }
}

// =============================================
//  ELIMINAR ESTUDIANTE (DELETE)
// =============================================
async function deleteStudent(id, btnEl) {
  if (!confirm("¿Estás seguro de eliminar este estudiante?")) return;

  btnEl.disabled = true;
  btnEl.textContent = "...";

  try {
    const res = await fetch(`${API_BASE}/api/students/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      // Animar la fila antes de eliminarla
      const row = btnEl.closest("tr");
      row.style.transition = "opacity 0.3s, transform 0.3s";
      row.style.opacity    = "0";
      row.style.transform  = "translateX(20px)";
      setTimeout(() => { row.remove(); checkEmpty(); }, 300);
    } else {
      const data = await res.json();
      alert(`Error: ${data.error || "No se pudo eliminar."}`);
      btnEl.disabled = false;
      btnEl.textContent = "Eliminar";
    }

  } catch (err) {
    alert(`Error de conexión: ${err.message}`);
    btnEl.disabled = false;
    btnEl.textContent = "Eliminar";
    console.error(err);
  }
}

// =============================================
//  UTILIDADES
// =============================================
function clearForm() {
  ["nombres", "apellidos", "carnet", "edad"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function checkEmpty() {
  const tbody    = document.getElementById("table-body");
  const emptyMsg = document.getElementById("empty-msg");
  if (tbody.children.length === 0) {
    emptyMsg.textContent   = "No hay estudiantes registrados.";
    emptyMsg.style.display = "block";
  }
}

function showMsg(el, text, type) {
  el.textContent  = text;
  el.className    = `form-msg ${type}`;
  // Auto-limpiar después de 4 segundos
  setTimeout(() => {
    el.textContent = "";
    el.className   = "form-msg";
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =============================================
//  INICIALIZAR
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();

  // Permitir enviar el formulario con Enter
  ["nombres","apellidos","carnet","edad"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") createStudent();
    });
  });
});